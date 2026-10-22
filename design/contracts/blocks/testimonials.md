# Contrato · Testimonials (`GbTestimonials01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #821, 2026-10-22; remates #837, #841, #842) · **Plan:** M5 (§4.1); receta R7 de `design/lab/marketing/r01/` · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GAvatar`, `GAccordion`, `GBtn`

## Promesa

Lo que dicen quienes ya estuvieron, **entero, en su idioma y con su fuente**, en tarjetas, con una voz destacada o en una lista que asoma.

## Props

```ts
interface GbTestimonialsProps {
  title: string
  description?: string
  items: Testimonial[]                 // 1 a 12 (C7 por encima de 12)
  labels?: { external?: string }
}
```

`rating` queda **reservado** (M-L2: sin `star` en la lista de la librería). Una calificación agregada («4,8 de 5») va en Stats.

## Anatomía de una opinión (común a las tres variantes)

```
figure
├─ blockquote [lang]  [cite = source.href]
│  └─ p × párrafos de `quote`
└─ figcaption
   ├─ author.name  (· author.role)
   └─ cite › source.label  — GBtn variant="link" si hay `source.href` (externo: marca y labels.external)
```

`GAvatar` (`name`, `src = author.avatar`, decorativo: el nombre ya está en `figcaption`) va fuera de la `figure`, en el slot `lead` de la tarjeta (en 02, la primera, en `media`: el hueco adopta la caja del avatar, #842). **La cita no se recorta** (sin `descriptionLines` ni «Leer más»).

**Nombre de la tarjeta (01 y 02, #837):** sin título visible, `GCard as="div" role="group"` con `aria-labelledby` al `span` de `author.name` del `figcaption` (el `role` hace falta: un `div` sin rol no admite nombre; `GCard` no avisa con `aria-labelledby` en `$attrs`).

**Tipografía (#841):** `figure`, `blockquote` y `figcaption` son texto suelto: irán en la primitiva de texto (`_comun.md` §11 B-L5; `figcaption` en `size="sm" tone="muted"`). Hasta entonces la sección queda en `draft` si la auditoría de coco confirma los márgenes del navegador (F-L1).

## Variantes

| Variante | Concepto | Compone |
| --- | --- | --- |
| **01 · Tarjetas** | Todas las opiniones en tarjetas iguales | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-wide"` › `GCard as="div"` (sin título) con `lead` = `GAvatar size="lg"` y la `figure` en el cuerpo |
| **02 · La voz** | La primera opinión destacada y el resto debajo, más discretas | `GSection` › `GStack gap="lg"` › [`GCard orientation="auto" mediaPosition="start"` con la foto del autor (`GAvatar size="xl"`) en `media` y la primera `figure`] + [`GStack as="ul" divided` › `li` › `figure` de las demás] |
| **03 · Avance** | Una lista que asoma: el nombre y la primera línea a la vista, la opinión entera al abrir | `GSection` › `GAccordion` (`headingLevel` un nivel por debajo) › `GAccordionItem` por opinión: `title` = `author.name`, `meta` = `source.label`, `peek` = primer párrafo de `quote`; el panel lleva la `figure` completa |

## Eventos y slots

`navigate` solo con `source.href` interno (las fuentes suelen ser externas: sin `navigate`, #574). Slot `quote` `{ item }` (escape: contenido rico dentro del `blockquote`).

## Qué lo hace distinto (#821)

**La cita entera y su fuente a la vista.** Nada de carrusel (2.2.2) ni de opiniones recortadas con «Leer más»: recortar una reseña cambia lo que dice. La fuente siempre está visible y enlazada (`cite`), así que el viajero puede comprobarla, y cada cita lleva su `lang`: la reseña de un viajero de Toronto se queda en inglés y el lector de pantalla la pronuncia en inglés (3.1.2), en lugar de una traducción que nadie firmó. En 03, el nombre y la primera línea bastan para recorrer muchas opiniones en el teléfono sin desplegar ninguna.

## Textos (`labels`)

`external` («se abre en otra pestaña»), requerido con una `source` externa (C5).

## Avisos propios (`[Grana GbTestimonials<NN>]`)

Comunes C1 a C3, C5 a C7. Además: **T1** · una opinión sin `source` (una vez por instancia; R7: una opinión sin fuente no es comprobable), **T2** · una cita de más de 600 caracteres (se pinta entera; la recomendación es elegir un fragmento con su enlace).

## Banco (`testimonials.bank.js`)

Cuatro opiniones: dos en español (Google, TripAdvisor con `href` externo), una en inglés con `lang="en"` y dos párrafos, una mínima: `quote`, `author.name` y `source.label` sin `href`, sin foto (sin `source` avisaría T1, y el banco no avisa).

## Verificación propia

Vitest: `figure > blockquote + figcaption` en las tres; `lang` en el `blockquote`; `cite` con la fuente; en 03, `peek` = primer párrafo y la `figure` en el panel; ningún recorte. Chromium: en 01 las tarjetas iguales a 1440 y una columna a 320.
