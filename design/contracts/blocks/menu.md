# Contrato · Menu (`GbMenu01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #875, 2026-10-22) · **Plan:** B9 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GPriceScope` + `GPrice`, `GText` (con `dl`, #863), `GTabs` + `GTabPanel`, `GAdaptiveLayout`, `GCard`, `GStack`, `GTag` (`@grana/vue/tag`) · **Parte de bruno:** C

## Promesa

La carta de un restaurante **en HTML, no en PDF**: por tiempos, cada plato con lo que lleva, su precio en la moneda dicha una vez y sus avisos (alérgenos, picante, vegetariano) **en palabras**. Lo agotado hoy se ve como agotado.

## Props

```ts
interface GbMenuProps {
  title: string
  description?: string
  sections: MenuSection[]                // 1 a 12 tiempos (C7); un tiempo con 1 a 40 platos
  prices: PriceRegion                    // obligatoria: una carta dice su moneda (#772)
  locale?: string
  labels: {
    tabs?: string                        // nombre del tablist (02)
    tags?: string                        // nombre de la lista de avisos de un plato («Contiene»)
    unavailable?: string                 // «Agotado hoy» (available: false)
    hours?: string                       // rótulo del horario del tiempo («Se sirve»)
    price?: PriceLabels & { legend?: string }   // a GPriceScope: legend, onRequest («Precio del día»), free…
  }
}
```

- **`MenuItem.price`** es un `PriceSpec` (normalmente solo `value`; `unit` «por pieza», `lead` «desde»). `null` = «a consultar» (`labels.price.onRequest`).
- **`MenuItem.lang`**: idioma del nombre del plato si no es el de la página (zapoteco, inglés: «Tlayudas», «Mole negro» se quedan en español en la carta en inglés) → `lang` en el elemento del nombre (3.1.2).
- **`MenuItem.tags`**: textos ya en el idioma de la página («Sin gluten», «Picante», «Contiene nuez»); son `GTag` **estáticas** (sin `href`, sin `pressed`), neutras (sin color de categoría: un aviso de alérgeno no se distingue por color).

## Un plato (común salvo 03)

```
GText as="div" (size por variante) › dl
└─ div por plato
   ├─ dt  [lang]  · name                        ← peso de término (#863)
   ├─ dd          · GPrice size="sm" (price)
   ├─ dd          · description                 (si hay)
   ├─ dd          · GStack as="ul" orientation="horizontal" gap="sm" [aria-label=labels.tags] › li › GTag size="sm"
   └─ dd          · labels.unavailable / motivo (si no está disponible)
```

**Orden: nombre → precio → descripción → avisos** (como se lee una carta impresa). El precio queda debajo del nombre, no al final del renglón (BK-L3, `_comun.md` §24: sin CSS no hay renglón con el precio al borde).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Carta** | Todos los tiempos en la página, uno debajo de otro | `GSection` › `GPriceScope` (leyenda una vez) › `GStack gap="lg"` › `GSection` anidada por tiempo (`id`, `title` = `name`, `description`; `hours` en `GText` con `labels.hours`) › el `dl` de platos (`size="body"`) | `media` |
| **02 · Por tiempos** | Una pestaña por tiempo («Desayuno · Comida · Cena»), la carta de uno a la vista | `GSection` › `GPriceScope` › `GTabs` (`label` = `labels.tabs`, `items` = tiempos con `id`) › `GTabPanel` por tiempo › `description`, `hours` y el `dl` de platos | `media` |
| **03 · Platos con foto** | Cada plato en una tarjeta con su foto | `GSection` › `GPriceScope` › `GStack gap="lg"` › `GSection` anidada por tiempo › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-standard"` › `GCard as="div"` (`title` = `name` con su `lang` por el slot `title`, `description`, `media` = la foto, cuerpo: `GPrice` + los `GTag`; no disponible en texto) | — (un plato sin `media` se pinta sin foto) |

**`id` de un tiempo** = ancla estable (`#comida`): en 01 y 03 lleva a su sección; en 02 abre su pestaña (`GTabs` con `modelValue` del `hash` al montar).

## Eventos y slots

Ninguno propio (la carta no tiene intención: pedir es de la aplicación). Slot `item` `{ item, section }` (escape: el cuerpo de un plato).

## Qué lo hace distinto (#875)

**La moneda se dice una vez y lo que lleva cada plato, en palabras.** La leyenda de `GPriceScope` dice «Precios en pesos mexicanos (MXN) · IVA incluido» una sola vez y cada precio queda en «$185» (el lector sigue oyendo «185 pesos mexicanos»). Los avisos de cada plato son texto («Contiene nuez»), nunca un icono solo ni un color; el nombre del plato conserva su idioma (`lang`) para que el lector lo pronuncie bien en la carta en inglés; y lo agotado hoy **se queda** con su aviso, en lugar de desaparecer y hacer dudar al comensal. Es una carta de verdad en la página: se busca con el navegador, se amplía y se lee sin descargar un PDF.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `tabs` | Sí, en 02 (C5) |
| `tags` | Sí, con algún `tags` (C5) |
| `unavailable` | Sí, con `available: false` (C5) |
| `hours` | Sí, con algún `hours` (C5) |
| `price` | `legend` (avisa `GPriceScope`), `onRequest` con un `null` (avisa `GPrice`) |

## Avisos propios (`[Grana GbMenu<NN>]`)

C1 a C4, C7, K3 (sin `prices`: se pinta sin región y cada precio con su código). Además: **M1** · un `MenuItem.price` en otra moneda que `prices.currency` (se pinta con su código; una carta con dos monedas sin alternativas suele ser un error de datos), **M2** · `section.id` repetido o ausente en 02 (se usa el índice).

## Banco (`menu.bank.js`)

Restaurante: tres tiempos (Desayuno con `hours`, Comida, Cena) con nueve platos: uno con `lang: 'zap'` en el nombre, uno con tres `tags`, uno `available: 'Agotado hoy'`, uno con precio `null`, uno con `unit` «por pieza», tres con foto; `prices` `{ currency: 'MXN', taxes: 'IVA incluido' }`; `labels` completos (con `price.legend` y `price.onRequest`).

## Verificación propia

Vitest: un `GPriceScope` por carta y ningún precio fuera de `GPrice`; `dl` real con `dt` y `dd` en el orden del contrato dentro de una `GText`; `lang` en el nombre; `GTag` sin `href` ni `pressed`; lo agotado en el DOM con su texto; 02 con una pestaña por tiempo y la del `hash` activa al montar. Chromium: precios con cifras tabulares (mismo ancho de dígito); 01 y 03 sin desbordar a 320 con un nombre largo; `dd` sin la sangría del navegador (#863, mide coco).
