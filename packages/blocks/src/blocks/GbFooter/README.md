# GbFooter · GbFooter01, GbFooter02 y GbFooter03

El pie del sitio: **cómo llegar y cómo escribir primero**, luego los enlaces del sitio, los legales y las redes, en columnas, en una sola línea o con la suscripción encima. El bloque compone `GStack`, `GAdaptiveLayout`, `GSection`, `GDivider`, `GBtn`, `GIcon` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`). Va suelto o **dentro** del slot `footer` de `GAppShell`.

**Etiquetas:** `<gb-footer-01>`, `<gb-footer-02>`, `<gb-footer-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbFooter01, GbFooter02, GbFooter03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/footer.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**El pie contesta «cómo llego y cómo os escribo» antes que nada** (DECISIONS #826). La persona que baja hasta el final busca la dirección, el WhatsApp y el horario, no el mapa del sitio: por eso el contacto va **primero** en el orden de lectura, en un `address` real, con los canales como enlaces que el teléfono abre (`tel:`, `https://wa.me/…`), y se queda incluso en la variante de una línea. Las redes van con texto: Lucide no dibuja marcas y un icono sin nombre no dice adónde lleva.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbFooterProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbFooter01` | Columnas: marca y contacto, columnas de enlaces y fila final | Raíz > `GStack gap="lg"` > [`GAdaptiveLayout gap="lg"` > marca y contacto (`g-adapt-wide`) + `nav` (`g-adapt-wide`) con un `GAdaptiveLayout` anidado de grupos] + `GDivider` + fila final | — |
| `GbFooter02` | Una línea: todo en una sola fila que se parte (marca, canales, legales, redes, nota) | Raíz > `GStack orientation="horizontal" gap="md"` | `groups`, `contact.address` y `contact.hours` (los **canales** se quedan) |
| `GbFooter03` | Con suscripción: una franja de suscripción arriba y debajo el pie de 01 | Raíz > `GStack gap="lg"` > slot `subscribe` + `GDivider` + lo de 01 | — (sin slot `subscribe`, se pinta como 01 con aviso O2) |

**Anatomía común:**

```text
{footer|div}
├─ marca y contacto                  (PRIMERO en el DOM)
│  ├─ GBtn variant="link" > logo o nombre
│  └─ GText as="address"
│     ├─ líneas de `address`
│     ├─ lista de canales (tel:, mailto:, https://wa.me/…)
│     └─ hours
├─ nav [aria-label=labels.nav] > una GSection por grupo > lista de enlaces
├─ GDivider decorative
└─ fila final: note · nav legal · lista de redes
```

- **Grupos:** cada grupo es una `GSection` (nivel automático) dentro de **un solo** `nav` con nombre, no un `nav` por columna (demasiados puntos de referencia). El enlace con `current: true` lleva `aria-current="page"`.
- **`as`:** `GAppShell` ya pinta el `footer` (el `contentinfo`) y un `footer` dentro de otro es HTML no válido. Suelto, `as="footer"` (el valor por defecto); dentro del chasis, **`as="div"`**. Con `as="footer"` dentro de otro `footer` o `[role="contentinfo"]`, aviso O1.
- **Logo:** `Brand.logo` es la única imagen suelta de los bloques: `width` y `height` obligatorios (C4), `alt` = `brand.name` y sin texto repetido junto a él.

## Dónde va `GText`

`GText` es la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../../../../vue/src/components/GText/README.md)). Aquí envuelve cuatro textos, y los legales y las redes **no** son texto suelto (son `GBtn variant="link"`):

| Variante | Texto suelto | `GText` |
| --- | --- | --- |
| 01 a 03 | `address` > líneas (con `br`) + lista de canales + horario | `as="address" size="body-sm"` (en 02, solo con los canales); sin cursiva |
| 01 a 03 | `note` (y el slot `note`) | `size="caption" tone="muted"` |
| 01 a 03 | La marca sin `href` (el logo o el nombre) | `GText` con el `size` y el `tone` por defecto: el nombre no se atenúa |

- Las líneas, los canales y el horario del `address` se separan con la pausa de `body-sm`, también junto a la lista de canales (que es un componente: el margen del bloque nativo se colapsa con su 0; 10 px a cada lado).
- Con `href`, la marca es un `GBtn variant="link"` y no lleva `GText`.

## Uso

```vue
<script setup>
import { GbFooter01 } from '@grana/blocks/marketing'

const footer = {
  brand: { name: 'Casa Alcalá', href: '/', logo: { src: '/logo.svg', width: 160, height: 48 } },
  contact: {
    address: ['Calle Macedonio Alcalá 407, Centro', '68000 Oaxaca de Juárez, Oax., México'],
    channels: [
      { label: 'WhatsApp +52 951 555 0000', href: 'https://wa.me/529515550000', external: true },
      { label: 'Llamar a recepción', href: 'tel:+529515550000' },
      { label: 'hola@casaalcala.mx', href: 'mailto:hola@casaalcala.mx' }
    ],
    hours: 'Recepción 24 h'
  },
  groups: [
    { title: 'Hotel', links: [{ label: 'Habitaciones', href: '/habitaciones', current: true }, { label: 'Desayuno', href: '/desayuno' }] },
    { title: 'Ayuda', links: [{ label: 'Preguntas frecuentes', href: '/ayuda' }, { label: 'English', href: '/en', lang: 'en', hreflang: 'en' }] }
  ],
  legal: [{ label: 'Privacidad', href: '/privacidad' }, { label: 'Términos', href: '/terminos' }],
  social: [{ label: 'Instagram', href: 'https://instagram.com/casaalcala', external: true }],
  note: '© 2026 Casa Alcalá',
  labels: { nav: 'Mapa del sitio', legal: 'Legal', social: 'Redes', external: 'se abre en otra pestaña' }
}

function onNavigate({ event, href, item }) {
  event.preventDefault() // item es el NavLink (o la marca)
  // router.push(href)
}
</script>

<template>
  <GbFooter01 v-bind="footer" @navigate="onNavigate" />
</template>
```

El mismo `footer` sirve para `GbFooter02` y `GbFooter03`.

## Ejemplos

### e1 · El pie de un hotel pequeño (`GbFooter01`)

**Por qué:** cuando el sitio tiene varias secciones y la persona busca primero cómo llegar. Contacto antes que los grupos, en dos columnas a 1440 px y apiladas en estrecho.

```vue
<GbFooter01 v-bind="footer" />
```

### e2 · Un pie mínimo en una línea (`GbFooter02`)

**Por qué:** cuando el sitio es una sola página. Marca, canales, legales, redes y nota en una fila que se parte sola a 320 px. Ignora `groups`, `contact.address` y `contact.hours`: si la dirección es lo que busca la persona, usa 01.

```vue
<GbFooter02 v-bind="footer" />
```

### e3 · Suscripción y pie juntos (`GbFooter03`)

**Por qué:** cuando quieres pedir el correo justo antes de que la persona se vaya. La franja es un bloque tuyo (por ejemplo `GbNewsletter01`) en el slot `subscribe`; sin él, el pie se pinta como 01 y avisa O2.

```vue
<GbFooter03 v-bind="footer">
  <template #subscribe>
    <GbNewsletter01 v-bind="newsletter" @submit="onSubmit" />
  </template>
</GbFooter03>
```

### e4 · Dentro del chasis de la aplicación (`as="div"`)

**Por qué:** `GAppShell` ya pinta el `footer` con su `contentinfo`; un pie dentro de otro es HTML no válido y deja dos puntos de referencia donde debe haber uno. Con `as="div"` el árbol de accesibilidad conserva uno solo.

```vue
<GAppShell>
  <template #footer>
    <GbFooter01 v-bind="footer" as="div" />
  </template>
  …
</GAppShell>
```

## Props

Una sola interfaz para las tres variantes (`GbFooterProps`). `Brand`, `NavLink`, `LinkGroup` y `FooterAs` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `brand` | `Brand` (requerida) | `{ name, href?, logo? }`: nombre (y logo) del sitio; con `href`, enlace a inicio. El logo exige `width` y `height` |
| `contact` | `{ address?: string[]; channels?: NavLink[]; hours?: string }` | Primero en el orden de lectura. `channels`: `tel:`, `mailto:`, `https://wa.me/…`. 02 solo pinta los canales |
| `groups` | `LinkGroup[]` | De 0 a 5 columnas (por encima de 5, aviso C7); 02 las ignora |
| `legal` | `NavLink[]` | Enlaces legales |
| `social` | `NavLink[]` | Redes, con texto |
| `note` | `string` | «© 2026 Casa Alcalá»; el slot `note` la sustituye |
| `as` | `'footer' \| 'div' = 'footer'` | `footer` suelto; `div` dentro del slot `footer` de `GAppShell` |
| `labels` | `{ nav?: string; legal?: string; social?: string; external?: string } = {}` | Nombres de los puntos de referencia y de la marca de enlace externo. Ver «Textos» |

`NavLink` es `{ label, href, external?, current?, lang?, hreflang? }`. `LinkGroup` es `{ title, links }`.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<NavLink \| Brand>`) | Activación primaria de un enlace interno (marca, columnas, legales, redes, canales no externos); `item` es el `NavLink` o la marca |

`tel:`, `mailto:`, `sms:` y los enlaces externos no emiten `navigate`: el navegador hace lo suyo.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `subscribe` | — | La franja de suscripción (por ejemplo `GbNewsletter01`) encima del pie; solo la usa 03. Sin él, 03 se pinta como 01 (O2) |
| `brand` | — | Escape: la marca |
| `note` | — | Escape: contenido rico de la nota, dentro de la misma `GText` |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `nav` | Sí, con `groups` en 01 y 03 (C5) |
| `legal` | Sí, con `legal` |
| `social` | Sí, con `social` |
| `external` | Sí, con un enlace externo (C5) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. Contacto antes que la navegación en el DOM, en un `address` real, sin cursiva; un solo `nav` de grupos con nombre y, con `as="div"` dentro de `GAppShell`, un solo `contentinfo` (`prueba`, Vitest; el árbol de accesibilidad en el chasis lo pide el contrato como medida de Chromium).
b. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo (`medido`, auditoría).
c. Canales, legales y redes (`GBtn variant="link"`, de 20 a 22 px de alto) pasan 2.5.8 por la excepción de separación en los tres motores y temas (`medido`, MK-N2).
d. Una pista `g-adapt-wide` en el `nav` de 01 y 03 reparte los grupos en dos columnas a 1440 px (MK-B3, cerrado; `medido`).
e. El logo cabe en su caja a 320 px (B-L3; `medido`) y la marca sin enlace cumple contraste y peso de texto (`medido`).
f. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría).
g. Nada se mueve (regla 10 de `_comun.md`).

> **Peligro.** Un `GbFooter` suelto con `as="footer"` dentro de `GAppShell` anida un `footer` en otro: HTML no válido y dos `contentinfo`, y la persona que navega por puntos de referencia oye «información de contenido» dos veces. Dentro del chasis, `as="div"` siempre (aviso O1 en desarrollo). Y una `NavLink` externa sin `labels.external` queda sin su aviso «se abre en otra pestaña».

## Avisos de desarrollo

Prefijo `[Grana GbFooter<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C2 | Un enlace sin `label` o `href` | Ese enlace se omite |
| C3 | `id` repetido | Se usa el índice |
| C4 | `brand.logo` sin `width`/`height` | Se pinta sin reservar el hueco |
| C5 | Falta un texto de `labels` (`nav`, `legal`, `social` o `external`) | Se pinta sin él |
| C6 | Un `href` con esquema `javascript:` | El enlace es un `GBtn` deshabilitado |
| C7 | Más de 5 grupos | Se pintan todos |
| O1 | `as="footer"` dentro de otro `footer` o `contentinfo` (al montar) | Se pinta igual |
| O2 | En 03, sin slot `subscribe` | Se pinta como 01 |
| O3 | Un canal `tel:` con letras o espacios sin normalizar | Se pinta, pero algunos teléfonos no marcan |

## Banco de datos de ejemplo

`footer.bank.js` exporta `{ props, slots, appIcons }`: Casa Alcalá con logo de 160 por 48 y `href="/"`, contacto completo (dos líneas con una palabra larga sin espacios para la prueba de 320 px, WhatsApp externo, `tel:+529515550000`, `mailto:` y horario), tres grupos (Hotel, Visita, Ayuda) con un enlace `current` y otro con `lang="en"`, `legal` (Privacidad, Términos), `social` (Instagram y Facebook, externos), `note`, `as="footer"` y `labels` completos. El slot `subscribe` es `GbNewsletter01` con su banco. El playground monta también el bloque dentro de un `GAppShell` con `as="div"`. Con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbFooter.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbFooter01` 3210 B, `GbFooter02` 2908 B, `GbFooter03` 3242 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin mapa ni formulario propios:** la suscripción es un bloque tuyo en el slot `subscribe`.
- **Redes con texto:** Lucide no tiene iconos de marcas (#826).
- **Sin CSS ni utilidades** (#763, #807). Las únicas clases que escribe son las pistas `g-adapt-*` de `GAdaptiveLayout`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbFooter` (tres variantes con el mismo banco, sin avisos, `props` compartidas, contacto antes que la navegación, `address` con canales, un solo `nav` de grupos con nombre, `aria-current`, `as="div"` sin `footer`, O1/O2/O3, `tel:`/`mailto:`/externos sin `navigate`, SSR) | 50/50 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia con `GText` real, 27 variantes, tema por defecto, rústico y lujo, claro y oscuro (7 `GText` reales en Footer, 0 `p` desnudos; incluida la marca sin enlace) | 4327/4327 en Chromium, Firefox y WebKit (coco, addendum de `design/lab/blocks/marketing/auditoria.md`, tras baea37f) | `medido` |
| Veredicto de coco | Footer puede pasar a `candidate`: MK-L1 en 0; MK-B3 cerrado | auditoría |

**No verificado:** lector de pantalla real (el orden contacto antes que navegación, `address`, un solo `contentinfo` dentro del chasis); `forced-colors` en Firefox y WebKit; teléfono real y puntero grueso (`tel:` y `wa.me` en un teléfono).

**Pendientes abiertos:** ninguno de la auditoría afecta a Footer. B-L1 a B-L7 en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/footer.md`](../../../../../design/contracts/blocks/footer.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§11 B-L5, reparto de `GText`).
- Decisiones: #815 a #817, #826, #834, #841, #844, #846, #851 a #856 en `DECISIONS.md`.
- Metadatos: [`GbFooter.meta.json`](./GbFooter.meta.json). Pruebas: [`GbFooter.test.js`](./GbFooter.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
