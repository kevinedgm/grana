# GbNewsletter · GbNewsletter01, GbNewsletter02 y GbNewsletter03

Un solo campo, el correo, con el botón acoplado, y **qué va a recibir la persona dicho antes de pedírselo**. El bloque valida, emite el correo y tu aplicación suscribe; no hace `fetch`. Va en línea, en una tarjeta o en una banda de marca. Compone `GSection`, `GForm`, `GInput`, `GBtn`, `GCard`, `GSurface` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`).

**Etiquetas:** `<gb-newsletter-01>`, `<gb-newsletter-02>`, `<gb-newsletter-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbNewsletter01, GbNewsletter02, GbNewsletter03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/newsletter.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Dice qué llega antes de pedir el correo, y no pide nada más** (DECISIONS #824). La promesa (`field.hint`: qué y cada cuánto) es obligatoria y es la descripción del campo: quien usa lector de pantalla la oye al llegar al campo, antes de escribir, no después de enviar. Un solo dato (sin nombre ni casillas de intereses), el botón acoplado a la caja (el anillo de foco rodea los dos) y el resultado dicho en el propio campo: la persona en el teléfono no pierde de vista lo que acaba de enviar.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbNewsletterProps`, el mismo objeto `props` de `props.js`).

| Variante | Concepto | Compone |
| --- | --- | --- |
| `GbNewsletter01` | En línea: la sección y el campo con el botón acoplado | `GSection` (título, descripción) > `GForm` > `GInput` + `GText size="caption" tone="muted"` con `legal` |
| `GbNewsletter02` | Tarjeta: la suscripción en una tarjeta | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, descripción) > cuerpo: el `GForm` de 01 y el legal |
| `GbNewsletter03` | Banda de marca: la suscripción en una banda de tinta de marca | `GSurface zone="brand" level="flat" padding="lg"` (raíz; sin borde ni radio) > el contenido de 01 |

**El formulario (igual en las tres):** `GForm` > `GInput type="email" autocomplete="email" required` (`label`, `hint`, `placeholder`, `name`), con el slot `action` ocupado por un `GBtn type="submit"` (`action.label`, `loading` = `busy`, `loadingText` = `labels.busy`). `error` llega al campo como error del formulario y `done` como su mensaje de éxito.

**Validación.** El bloque lee el `ValidityState` del propio `input` (la regla del correo es la del navegador para `type="email"`, sin expresión propia): un campo vacío da `labels.required` y un correo mal formado, `labels.invalid`. Ese texto entra al campo al escribir y al enviar, y con error el envío revela el mensaje, enfoca el campo y **no** emite `submit`. Sin el texto que el estado necesita, avisa C5 y, como último recurso, se usa el mensaje del navegador (sale en el idioma del navegador, no en el de la página). `error` (el del servidor) gana a la validación y se revela en el acto, también si llega ya al montar; `done` solo se pinta sin error.

## Dónde va `GText`

`GText` es la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../../../../vue/src/components/GText/README.md)). Aquí envuelve el texto legal:

| Variante | Texto suelto | `GText` |
| --- | --- | --- |
| 01, 02 y 03 | `legal` (el texto, su enlace y el slot `legal`) | `size="caption" tone="muted"`, hijo del `GForm`; sin `legal` ni slot, no se pinta |

- El legal pesa lo mismo que la ayuda del campo (peso de texto, no el de rótulo del rol `caption`).
- **Queda a 40 px de la ayuda del campo**, el `gap` de `GForm`, sin ningún margen propio. Con el `p` desnudo eran 54–56 px (márgenes del navegador sumados al `gap`; `medido`, tres temas). Si un día el legal debe ir «con el campo», será una `GStack gap="sm"`, nunca un margen.

## Uso

```vue
<script setup>
import { GbNewsletter01 } from '@grana/blocks/marketing'
import { ref } from 'vue'

const busy = ref(false)
const done = ref()
const error = ref()

const newsletter = {
  title: 'Fechas libres, primero para ti',
  description: 'Cuando se abre una habitación en temporada alta, te escribimos antes que a nadie.',
  field: {
    label: 'Tu correo',
    hint: 'Un correo al mes con fechas libres y nada más.',
    placeholder: 'nombre@correo.com',
    name: 'email'
  },
  action: { label: 'Suscribirme' },
  legal: { text: 'Puedes darte de baja cuando quieras.', link: { label: 'Aviso de privacidad', href: '/privacidad' } },
  labels: {
    busy: 'Suscribiendo…',
    required: 'Escribe tu correo.',
    invalid: 'Revisa el correo: falta algo como nombre@dominio.com.',
    form: { error: 'Error: ', valid: 'Listo: ' }
  }
}

async function onSubmit({ email }) {
  busy.value = true
  error.value = undefined
  try {
    await suscribir(email) // tu aplicación suscribe; el bloque no hace fetch
    done.value = 'Listo: revisa tu correo para confirmar.'
  } catch {
    error.value = 'No pudimos suscribirte; inténtalo de nuevo.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <GbNewsletter01 v-bind="newsletter" :busy="busy" :done="done" :error="error" @submit="onSubmit" />
</template>
```

El bloque no anuncia el resultado (no tiene región viva propia): tu aplicación pone `busy`, luego `done` o `error`. Si quieres que se oiga fuera del campo, avisa también con `useToast()` de `GToast`.

## Ejemplos

### e1 · La suscripción al final de un artículo (`GbNewsletter01`)

**Por qué:** cuando el correo es secundario y debe leerse como parte de la página. El título, la promesa del campo y el legal van uno debajo del otro sin superficie.

```vue
<GbNewsletter01 v-bind="newsletter" @submit="onSubmit" />
```

### e2 · La suscripción como objeto aparte (`GbNewsletter02`)

**Por qué:** cuando quieres que se distinga de la página que la rodea, sin la fuerza de una banda de marca. La tarjeta lleva el título al nivel de la sección.

```vue
<GbNewsletter02 v-bind="newsletter" @submit="onSubmit" />
```

### e3 · La suscripción como cierre de la página (`GbNewsletter03`)

**Por qué:** cuando la suscripción es el último paso y merece una banda. Es la banda de marca de la página: una por página.

```vue
<GContainer>
  <GbNewsletter03 v-bind="newsletter" class="g-bleed" @submit="onSubmit" />
</GContainer>
```

### e4 · Un legal con contenido rico (slot `legal`)

**Por qué:** cuando el aviso necesita dos enlaces o un matiz que `legal.text` y `legal.link` no cubren. El slot sustituye al texto y al enlace dentro de la misma `GText`.

```vue
<GbNewsletter01 v-bind="newsletter" @submit="onSubmit">
  <template #legal>
    Puedes darte de baja cuando quieras. <a href="/privacidad">Aviso de privacidad</a>
  </template>
</GbNewsletter01>
```

## Props

Una sola interfaz para las tres variantes (`GbNewsletterProps`). `Action`, `NavLink` y `BlockSubmit` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título (de la sección en 01 y 03; de la tarjeta, al nivel de la sección, en 02) |
| `description` | `string` | Descripción; el slot `description` la sustituye |
| `field` | `{ label: string; hint: string; placeholder?: string; name?: string }` (requerida) | El campo. `hint` es la promesa (qué llega y cada cuánto) y la descripción del campo: sin ella, aviso N1. `name`, sin valor, es `email` |
| `action` | `{ label: string; icon?: string }` (requerida) | El botón de envío (`Pick<Action, 'label' \| 'icon'>`; el `href` se ignora) |
| `legal` | `{ text: string; link?: NavLink }` | «Puedes darte de baja cuando quieras.» y el enlace al aviso de privacidad |
| `busy` | `boolean = false` | Enviando: el botón muestra su estado de carga con `labels.busy` |
| `error` | `string` | Error de tu aplicación, en el campo y revelado en el acto. Gana a `done` (aviso N2) |
| `done` | `string` | Confirmación de tu aplicación, en el campo |
| `labels` | `{ busy?: string; external?: string; required?: string; invalid?: string; form?: { error?: string; valid?: string } } = {}` | Ver «Textos» |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, email }` (`BlockSubmit`) | Envío válido; `email` va sin espacios a los lados |
| `navigate` | `{ event, href, item }` (`BlockNavigate<NavLink>`) | Activación primaria del enlace interno de `legal`; `item` es `legal.link` |

Un enlace de `legal` `external` no emite `navigate`. Sin escucha de `submit`, el correo no irá a ninguna parte (aviso N3).

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `legal` | — | Escape: contenido rico del texto legal (sustituye a `legal.text` y su enlace) |
| `description` | — | Sustituye a la prop `description` (en la `GSection` o en la `GCard`) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `busy` | Sí, si usas `busy` (C5; es el texto de carga del botón) |
| `required` | Sí: se necesita en cuanto alguien envía vacío (C5; sin él, el mensaje del navegador) |
| `invalid` | Sí: se necesita en cuanto el correo no está bien formado (C5; sin él, el mensaje del navegador) |
| `form.error` | Sí, con `error` o con un error de validación (avisa `GForm`) |
| `form.valid` | Sí, con `done` (avisa `GForm`) |
| `external` | Sí, con un `legal.link` externo (C5) |

`labels.form` va tal cual a los `labels` de `GForm`: son los prefijos ocultos que anteceden al mensaje del campo («Error: », «Listo: »). El bloque no avisa por ellos: avisa `GForm`.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. La promesa del campo (`hint`) es su descripción: se oye al llegar al campo (`prueba`, Vitest: `hint` en `aria-describedby`).
b. Un campo vacío da `labels.required` y un correo mal formado, `labels.invalid`, en el campo y sin `submit` (`prueba`).
c. Un `error` presente al montar se ve: el campo lleva `aria-invalid` y el mensaje, con contraste ≥ 4,5:1, en las tres variantes y tres temas (MK-B1, cerrado en bc843a6; `medido` en Chromium, 36 comprobaciones).
d. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo; los estados `busy` y `done` también ≥ 4,5:1 dentro de la banda de marca (`medido`, auditoría).
e. El enlace de texto del legal mide 22 px de alto y cumple 2.5.8 por la excepción de separación (`medido`, nota informativa del verificador).
f. Campo y botón en una línea a 390 px y sin desbordamiento a 320 (`medido`); sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 %.
g. Nada se mueve (el giro de carga es del botón, auditado aparte).

> **Peligro.** Sin `labels.required` y `labels.invalid`, el error de validación sale con el mensaje del navegador, en el idioma del navegador y no en el de la página: la persona de un sitio en español lee el aviso en el idioma de su navegador, que puede no ser el suyo. Y sin escuchar `submit` no se envía nada (aviso N3): el botón funciona, el campo se valida y el correo no llega a ninguna parte.

## Avisos de desarrollo

Prefijo `[Grana GbNewsletter<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C5 | Falta `labels.busy` con `busy`, `labels.external` con un `legal.link` externo, o `labels.required` / `labels.invalid` al validar | Se pinta sin ese texto (al validar, con el mensaje del navegador) |
| C6 | Un `href` con esquema `javascript:` | El enlace del legal es un `GBtn` deshabilitado |
| N1 | Falta `field.hint` | Se pinta sin la promesa |
| N2 | `error` y `done` a la vez | Gana `error` |
| N3 | Sin escucha de `submit` | El correo no irá a ninguna parte |

## Banco de datos de ejemplo

`newsletter.bank.js` exporta `{ props, slots, states, appIcons }`: «Fechas libres, primero para ti», una descripción con una palabra larga sin espacios, `field` completo, `action` «Suscribirme» con `icon: 'mail'` (que la página registra con `createIcons`), `legal` con enlace interno al aviso de privacidad, `labels` completos y una escucha mínima de `submit`. `states` trae `busy`, `error` y `done`; el banco por defecto no usa ninguno. Con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbNewsletter.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbNewsletter01` 2508 B, `GbNewsletter02` 2550 B, `GbNewsletter03` 2538 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Un solo dato:** sin nombre, sin casillas de intereses.
- **El bloque no suscribe ni anuncia el resultado** (#792): tu aplicación suscribe, pone `busy`, `done` o `error` y, si quiere que se oiga fuera del campo, usa `GToast`.
- **Una banda de marca por página** (R5): 03 cuenta como tal.
- **Sin CSS ni utilidades** (#763, #807); la banda a sangre es `g-bleed` en tu raíz.
- **Sin `fetch`, sin estado de negocio** (#780).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbNewsletter` (tres variantes con el mismo banco, sin avisos, `props` compartidas, campo con acción acoplada, legal como `GText` `caption` `muted`, `hint` en `aria-describedby`, validación con `labels.required`/`invalid` sin `submit`, C5 con el mensaje del navegador, `labels.form` sin avisos de `GForm`, `submit` con el correo recortado, `busy`, `error` y `done`, 02 con el título al nivel de la sección, 03 en zona de marca, SSR) | 52/52 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia con `GText` real, 27 variantes, tema por defecto, rústico y lujo, claro y oscuro (3 `GText` reales en Newsletter, 0 `p` desnudos; hueco entre la ayuda y el legal ≤ 40 px) | 4327/4327 en Chromium, Firefox y WebKit (coco, addendum de `design/lab/blocks/marketing/auditoria.md`, tras baea37f) | `medido` |
| MK-B1 (`error` al montar) | 36 comprobaciones ok en Chromium tras bc843a6; Firefox y WebKit dentro de los 4327 | `medido` |
| Veredicto de coco | Newsletter puede pasar a `candidate`: MK-L1 en 0; MK-B1 y MK-C3 cerrados | auditoría |

**No verificado:** lector de pantalla real (la promesa por `aria-describedby`, el mensaje del campo al validar); `forced-colors` en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** ninguno de la auditoría afecta a Newsletter. B-L1 a B-L7 en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/newsletter.md`](../../../../../design/contracts/blocks/newsletter.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§11 B-L5, reparto de `GText`).
- Decisiones: #815 a #817, #824, #830, #839, #840, #841, #844, #851 a #856 en `DECISIONS.md`.
- Metadatos: [`GbNewsletter.meta.json`](./GbNewsletter.meta.json). Pruebas: [`GbNewsletter.test.js`](./GbNewsletter.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
