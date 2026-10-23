# Contrato · Trust (`GbTrust01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #926, 2026-10-23) · **Plan:** E12 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GIcon`, `GBtn`, `GText` · **Parte de bruno:** A

## Promesa

Lo que la tienda promete (envío, devoluciones, pago seguro, hecho a mano) **dicho en una frase y con su letra pequeña a un toque**.

## Props

```ts
interface GbTrustProps {
  title: string
  description?: string
  items: Incentive[]                   // 1 a 6 (C7 por encima de 6)
  labels?: {
    policy?: string | ((title: string) => string)   // «Ver la política» / «Ver {title}» (enlace de `policy`)
    external?: string
  }
}
```

## Anatomía de una promesa (común)

- **Icono** (`icon`, Lucide; la aplicación lo registra con `createIcons` si no es de la librería, #200): **decorativo** (la promesa la dice el título). Sin icono, la promesa se pinta igual.
- **Título** y **descripción** (`description`, una o dos líneas).
- **Su prueba**: `action` (un `GBtn variant="link"`, `navigate`/`activate` de §4) **o**, con `policy` y sin `action`, un `GBtn variant="link"` con `href="#{policy}"` y el texto `labels.policy` (el ancla de `GbPolicies`, como `Consent.policy`, #880). Sin ninguna de las dos, la promesa va sin enlace (se permite; PR1 recomienda dar su prueba).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Fila** | Tres o cuatro promesas en una fila bajo el héroe o sobre el pie | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-short"` › `GCard as="div" level="flat" density="compact"` (`lead` = `GIcon`, `title`, `description`, `actions` = la prueba) | — |
| **02 · Tarjetas** | Cada promesa en su tarjeta, con más texto | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-standard"` › `GCard as="div"` (outlined) con el mismo contenido | — |
| **03 · Lista al pie** | Una lista compacta en el pie del carrito o del pago | `GSection` › `GStack as="ul" gap="sm"` › `li` › `GText size="body-sm"` (el `GIcon` en línea, 1em, decorativo, + el título en `strong` + la descripción) + la prueba en `GBtn variant="link"` | — |

En 03 la promesa **no** es un encabezado (una lista al pie con cuatro `h3` ensucia la navegación por encabezados); en 01 y 02 el título de la tarjeta va al nivel de dentro (§1 regla 6).

## Eventos

`navigate` y `activate` de las pruebas (§4; `item` = el `Incentive`). Un enlace `#policy` es un ancla de la página: emite `navigate` (la aplicación con router puede desplazar con su propio scroll).

## Slots

`item` `{ item }` (escape: el cuerpo de una promesa), `description`.

## Estructura accesible

`GSection` con título; lista real; icono `aria-hidden`; la prueba es un enlace con su texto («Ver la política de devoluciones»). Sin logotipos de pasarelas como imagen sin texto: si la aplicación quiere marcas de pago, cada una lleva su nombre (receta del README).

## Qué lo hace distinto (#926)

**Cada promesa lleva a su letra pequeña.** «Devoluciones en 30 días» no es un eslogan: enlaza a la política que la sostiene (el mismo ancla que el consentimiento del pago), así quien duda la lee en un toque y la tienda no promete lo que no escribió. Sin sellos de «compra segura» dibujados ni logotipos mudos: la confianza se dice en palabras.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `policy` | Sí, con alguna promesa con `policy` y sin `action` (C5; sin él, sin enlace) |
| `external` | Sí, con una prueba externa (C5) |

## Avisos propios (`[Grana GbTrust<NN>]`)

C1 a C3, C5 a C7. Además: **PR1** · una promesa sin `action` ni `policy` (se pinta sin prueba; una vez por instancia).

## Banco (`trust.bank.js`)

Barro y Agave: «Envío a todo México» (`truck`, con `policy: 'envios'`), «Devoluciones en 30 días» (`rotate-ccw`, `policy: 'devoluciones'`), «Hecho a mano en Oaxaca» (`hand`, `action` interna a «Nuestros talleres»), «Pago seguro» (`lock`, `policy: 'pagos'`); iconos de la lista de la librería o registrados en el banco.

## Verificación propia

Vitest: lista real; icono decorativo; la prueba con `href="#{policy}"` y su texto; 03 sin encabezados; PR1 una vez. Chromium: 01 en una fila a 1440 y en columna a 320 sin desbordar.
