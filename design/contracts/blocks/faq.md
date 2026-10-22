# Contrato · FAQ (`GbFaq01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #823, 2026-10-22; remates #841) · **Plan:** M8 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GAccordion` + `GAccordionItem`, `GContainer`, `GStack`, `GInput`, `GEmpty`

## Promesa

Las preguntas que el viajero haría por WhatsApp, contestadas en la página: **plegadas con su primera línea a la vista, todas abiertas, o con un buscador**, y cada respuesta con su propio enlace.

## Props

```ts
interface GbFaqProps {
  title: string
  description?: string
  items: Faq[]                         // 1 a 40 (C7 por encima de 40)
  labels?: {
    search?: string                    // etiqueta del buscador (03)
    matches?: string | ((p: { count: number; total: number }) => string)   // «{count} de {total} preguntas» (03; String con {count}/{total} o función, como #51)
    none?: string                      // título del vacío de la búsqueda (03)
    clear?: string                     // «Borrar búsqueda» (03)
  }
}
```

`answer` es texto plano: cada bloque separado por una línea en blanco es un `p`. Para enlaces o listas en una respuesta, slot `answer`. Los párrafos son texto suelto: irán en la primitiva de texto (`as="div"`, #841) cuando exista.

## Variantes

| Variante | Concepto | Compone | Notas |
| --- | --- | --- | --- |
| **01 · Acordeón** | Plegadas, cada una con su primera línea a la vista | `GSection` › `GAccordion` (`headingLevel` un nivel por debajo) › `GAccordionItem` (`id` = `faq.id`, `title` = `question`, `peek` = primer párrafo de `answer`) › párrafos | El corte del avance a una línea es de `GAccordion` (A «Avance», #483) |
| **02 · Todo a la vista** | Todas abiertas, una tras otra, a medida de lectura | `GSection` › `GContainer width="reading" horizontal="start"` › `GStack as="ul" divided` › `li` › `GSection` anidada (`id` = `faq.id`, `title` = `question`) › párrafos | Corrige «dos columnas» del plan (`_comun.md` §10) |
| **03 · Con buscador** | El acordeón de 01 con un campo que filtra mientras se escribe | `GSection` › `GInput type="search"` (`label` = `labels.search`, `output` = la cuenta) + el `GAccordion` de 01 con las que coinciden; sin coincidencias, `GEmpty cause="filtered"` | Ver «Buscador» |

### Buscador (03)

- **Coincidencia:** lo escrito, sin mayúsculas ni diacríticos (`NFD` sin marcas), contenido en `question` o en `answer`. Las que no coinciden **no se pintan** (sin `v-show`: fuera del orden de lectura); las abiertas siguen abiertas; **ninguna se abre sola** al coincidir (nada se mueve mientras se escribe).
- **Cuenta:** el `output` de `GInput` (su propia región cortés, `input.md` C12) dice `labels.matches({ count, total })` **300 ms después de la última tecla** (`SEARCH_MS`, como `resource-list.md`) y nada con el campo vacío. Es la única voz: el bloque no tiene región propia (#792).
- **Vacío:** `GEmpty cause="filtered"` con la búsqueda como su único filtro; su `clear` (y `relax`) vacían el campo y devuelven el foco al campo. Textos de `GEmpty` desde `labels.none` y `labels.clear`.
- Sin envío: el campo no está en un `form` y Intro no hace nada.

## Eventos y slots

Ningún evento propio (abrir y cerrar es estado del acordeón; buscar no es intención para la aplicación). Slot `answer` `{ item }` (contenido rico de la respuesta; en 01 y 03 el `peek` sigue saliendo del primer párrafo de `answer` en texto).

## Qué lo hace distinto (#823)

**Cada respuesta tiene su enlace, y asoma cerrada.** Con `faq.id`, la pregunta tiene un ancla estable (`#mascotas`): el dueño del hotel contesta un WhatsApp con `…/preguntas#mascotas` y el viajero llega **a la respuesta abierta** (`GAccordionItem` abre con `#id`, #482; en 02 es la sección). Cerrada, la primera línea de la respuesta ya está a la vista (muchas veces basta) y la búsqueda del navegador encuentra el texto plegado (`hidden="until-found"`). El buscador de 03 mira también dentro de las respuestas y no mueve nada mientras se escribe.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `search`, `matches`, `none`, `clear` | Sí, en 03 (C5; sin `search`, el campo no tendría nombre: aviso y se pinta con la etiqueta vacía) |

## Avisos propios (`[Grana GbFaq<NN>]`)

Comunes C1 a C3, C5 y C7. Además: **Q1** · una pregunta sin `id` (una vez por instancia: sin ancla estable no se puede enlazar), **Q2** · `id` que no es un identificador válido de fragmento (con espacios).

## Banco (`faq.bank.js`)

Ocho preguntas con `id` (`mascotas`, `estacionamiento`, `llegada`, `desayuno`, `ninos`, `cancelacion`, `factura`, `idiomas`), una respuesta de tres párrafos, una en inglés con la palabra larga, una mínima de una frase; `labels` completos. Búsquedas de prueba: «mascota» (1), «MASCOTA» (1), «nino» con «niños» en el texto (1), «xyz» (vacío).

## Verificación propia

Vitest: `id` en el elemento (01, 03) y en la sección (02); `peek` = primer párrafo; búsqueda sin diacríticos ni mayúsculas en pregunta y respuesta; cuenta en el `output` tras `SEARCH_MS` con temporizadores falsos; vacío con `GEmpty` y `clear` que vacía y enfoca el campo; ninguna se abre sola. Chromium: `#mascotas` en la URL abre esa respuesta en 01 y 03; la búsqueda del navegador encuentra texto plegado.
