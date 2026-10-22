# Contrato · Footer (`GbFooter01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #826, 2026-10-22; remates #834, #841, #856) · **Plan:** M14 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GStack`, `GAdaptiveLayout`, `GSection`, `GDivider`, `GBtn`, `GIcon`; va **dentro** del slot `footer` de `GAppShell` o suelto

## Promesa

El pie del sitio: **cómo llegar y cómo escribir primero**, luego los enlaces del sitio, los legales y las redes, en columnas, en una línea o con la suscripción.

## Props

```ts
interface GbFooterProps {
  brand: Brand                         // nombre (y logo) del sitio; con href, enlace a inicio
  contact?: {
    address?: string[]                 // líneas de la dirección postal
    channels?: NavLink[]               // WhatsApp, teléfono (tel:), correo (mailto:)
    hours?: string                     // «Recepción 24 h»
  }
  groups?: LinkGroup[]                 // 0 a 5 columnas (C7 por encima de 5)
  legal?: NavLink[]
  social?: NavLink[]                   // con texto: Lucide no tiene iconos de marcas
  note?: string                        // «© 2026 Casa Alcalá»
  as?: 'footer' | 'div'                // 'footer' (por defecto) suelto; 'div' dentro del slot footer de GAppShell
  labels?: { nav?: string; legal?: string; social?: string; external?: string }
}
```

- **`as`:** `GAppShell` ya pinta el `footer` (`contentinfo`, `app-shell.md`); un `footer` dentro de otro es HTML inválido. Dentro del chasis, `as="div"`. Con `as="footer"` y un `footer` o `[role="contentinfo"]` antepasado, aviso O1 (en `onMounted`).
- **Tipografía (#841, #856; `text.md`):** el contacto es `GText as="address" size="body-sm"` (sin cursiva; sus líneas, los canales y el horario se separan con la pausa de `body-sm`, también junto al `GStack` de canales); `note` (y su slot) es `GText size="caption" tone="muted"`; la marca sin enlace, `GText` con los valores por defecto (el nombre no se atenúa; no medido por kiwi: lo mide coco). Los legales son `GBtn variant="link"` (no texto suelto). Reparto en `_comun.md` §11 B-L5. La sección sigue en `draft` hasta que bruno la cambie y la auditoría de coco lo confirme (F-L1, MK-L1).
- **Logo:** `Brand.logo` es la única imagen suelta de los bloques (hallazgo B-L3): `width`/`height` obligatorios (C4), `alt = brand.name` y sin texto repetido junto a él.

## Anatomía común

```
{footer|div} [data-gb]
├─ div · marca y contacto           ← PRIMERO en el DOM
│  ├─ GBtn variant="link" (brand.href) › logo o nombre
│  └─ GText as="address" size="body-sm"
│     ├─ líneas de `address`
│     ├─ GStack as="ul" › GBtn variant="link" por canal (tel:, mailto:, https://wa.me/…)
│     └─ hours
├─ nav [aria-label=labels.nav] › una GSection por grupo (title) › GStack as="ul" gap="sm" › GBtn variant="link"
├─ GDivider decorative
└─ GStack orientation="horizontal" gap="md" (fila final)
   ├─ GText size="caption" tone="muted" · note
   ├─ nav [aria-label=labels.legal] › GStack as="ul" orientation="horizontal" gap="sm" › GBtn variant="link"
   └─ GStack as="ul" orientation="horizontal" gap="sm" [aria-label=labels.social] › li › GBtn variant="link" (externos: marca y labels.external)
```

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Columnas** | Marca y contacto, columnas de enlaces y fila final | Raíz › `GStack gap="lg"` › [`GAdaptiveLayout gap="lg"` › marca y contacto (`g-adapt-wide`) + `nav` con la pista **`g-adapt-wide`** y dentro un `GAdaptiveLayout` anidado de grupos (`g-adapt-standard`; #846)] + `GDivider` + fila final | — |
| **02 · Una línea** | Todo en una sola fila que se parte: marca, canales, legales, redes, nota | Raíz › `GStack orientation="horizontal" gap="md"` | `groups`, `contact.address`, `contact.hours` (los **canales** se quedan) |
| **03 · Con suscripción** | Una franja de suscripción arriba y debajo el pie de 01 | Raíz › `GStack gap="lg"` › slot `subscribe` (p. ej. `GbNewsletter01`) + `GDivider` + lo de 01 | — (sin slot `subscribe`, se pinta como 01 con aviso O2) |

**Grupos:** cada grupo es una `GSection` (nivel automático: `h2` fuera de toda sección), dentro de **un solo** `nav` con nombre (no un `nav` por columna: demasiados puntos de referencia). Enlace actual con `aria-current="page"`.

## Eventos y slots

`navigate` (todos los enlaces internos; los `tel:`, `mailto:` y externos no lo emiten: el navegador hace lo suyo). Slots: `subscribe` (03), `brand` (escape: la marca), `note` (escape: contenido rico de la nota).

## Qué lo hace distinto (#826)

**El pie contesta «cómo llego y cómo os escribo» antes que nada.** El viajero que baja hasta el final busca la dirección, el WhatsApp y el horario, no el mapa del sitio: por eso el contacto va **primero** en el orden de lectura, en un `address` real, con los canales como enlaces que el teléfono abre (`tel:`, `https://wa.me/…`), y se queda incluso en la variante de una línea. Las redes van con texto (Lucide no dibuja marcas y un icono sin nombre no dice adónde lleva).

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `nav` | Sí, con `groups` en 01 y 03 (C5) |
| `legal` | Sí, con `legal` |
| `social` | Sí, con `social` |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbFooter<NN>]`)

Comunes C3 a C7. Además: **O1** · `as="footer"` dentro de otro `footer` o `contentinfo`, **O2** · 03 sin slot `subscribe`, **O3** · un canal `tel:` con letras o espacios sin normalizar (`tel:+52 951…`: se pinta, pero algunos teléfonos no marcan).

## Banco (`footer.bank.js`)

Casa Alcalá: `brand` con logo 160 × 48 y `href="/"`; `contact` (dos líneas de dirección, WhatsApp externo, `tel:+529515550000`, `mailto:`, horario); tres `groups` (Hotel, Visita, Ayuda) con un enlace `current`; `legal` (Privacidad, Términos); `social` (Instagram y Facebook, externos); `note`; `as="footer"`; `labels` completos. El playground monta también el bloque dentro de un `GAppShell` con `as="div"`.

## Verificación propia

Vitest: contacto antes que la navegación en el DOM; `address` con canales; un solo `nav` de grupos con nombre; `aria-current` en el actual; `as="div"` sin `footer`; O1 con un `footer` antepasado; `tel:`/`mailto:`/externos sin `navigate`. Chromium: logo y fila final sin desbordamiento a 320; dentro de `GAppShell`, un solo `contentinfo` en el árbol de accesibilidad.
