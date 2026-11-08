# Brief · marco del sitio de documentación (r01)

> kiwi, 2026-11-08. Ronda de estructura e identidad del **marco** (shell) del sitio `site/` antes de construirlo con componentes de Grana. No toca el contenido de las páginas (es de mora-docs, `docs/documentacion/contrato.md`) ni el motor (VitePress 1.6.4, ver «Motor» en `declaracion.md`). Prototipo: `index.html?c=A|B|C&p=comp|home|guide&theme=dark&lang=en`. Verificación: `node design/lab/sitio/r01/verificar.mjs` (puerto 4231).

## 1. Función

El marco lleva a la persona **a la página que necesita y al punto de la página que necesita**, le dice **dónde está** (sección del sitio, componente, sección de la página) y **qué versión lee**, y le deja **cambiar tema e idioma sin perder el sitio**. No enseña componentes (eso es la página); no compite con la ficha viva por el ancho.

## 2. Personas y lo que piden al marco

| Persona | Tarea | Lo que el marco debe dar | Hoy (VitePress) |
| --- | --- | --- | --- |
| **Evalúa en 30 s** (líder técnico, diseñador) | «¿Qué hay, qué calidad tiene, se ve bien?» | El catálogo entero a la vista, estado de cada pieza, una ficha viva sin buscarla | La portada dice «64 componentes» (hay 78; hallazgo H1) y el catálogo vive en una barra lateral plegada por grupos |
| **Adopta** (instala, configura el tema) | Seguir una guía de principio a fin | Orden de lectura, anterior/siguiente, ancho de lectura cómodo, saber en qué sección de la guía va | Correcto, pero la guía comparte la misma columna de 624 px que la ficha |
| **Vuelve a consultar** (ya usa Grana) | «¿Cómo se llamaba la prop?», «¿qué hace Tab en el combobox?» | Llegar en dos o tres gestos al dato, por teclado; mismo sitio del dato en cada ficha | `⌘K` abre MiniSearch; el índice derecho trunca («Pacientes entre miles: el s…»), la ficha viva queda apretada (624 px de columna con 224 px de índice y 272 de barra) |

## 3. Datos

- **78 componentes** en 10 grupos (`site/src/.site-data.json`: Estructura de página 8, Acciones y navegación 11, Campos de entrada 14, Estructura de formularios 10, Datos 13, Superficies 8, Paneles 4, Avisos y estado 6, Captura de voz 4); 79 `meta.json` en `candidate` y 3 en `draft`.
- **Blocks** por familia (Marketing 9, Booking 11, Ecommerce 12; SaaS en curso) con su propia barra.
- **Guía** (9 páginas: Empezar, Tematización, @grana/cli, Utilidades, Accesibilidad, Personalidad, Proyecto, Cambios, Playground de tema).
- **Dos idiomas** (`es` raíz, `en/` con «Translation pending» cuando falta `README.en.md`: 124 avisos `::: warning`). Toda página existe en los dos idiomas (el generador la crea), así que **la ruta equivalente siempre existe**.
- **Secciones de una ficha:** entre 17 y 25 `h2` según el README, **no** en el orden de contrato §3 (combobox: «Prueba en vivo, Ejemplo, Instalación, Qué lo hace distinto, Uso, Opciones, Props…, Referencia de la API»). «Props» y «Referencia de la API» aparecen las dos (hallazgo H2).
- **Índice de búsqueda local:** ≈ 1,6 MB por idioma (MiniSearch de VitePress, cargado al abrir; comentario de `site/tests/site.spec.mjs`).

## 4. Estados del marco

| Estado | Qué pasa |
| --- | --- |
| Carga / hidratación | El marco se pinta en SSR con la página actual marcada; nada salta al hidratar (regla #1033). El índice de búsqueda **no** carga hasta el primer uso |
| Página actual | `aria-current="page"` en el índice global (uno), miga con la página actual, sección actual de la página con `aria-current="location"` (o `true`) |
| Búsqueda vacía | Antes de escribir: recientes o los grupos (no un panel vacío) |
| Sin resultados | «Ningún título con «x»» + ofrecer el texto completo; anuncio cortés |
| Ancho / estrecho | Ancho ≥ 1024: índice global visible (A, C) o estaciones (B). Estrecho ≤ 767: índice en drawer (A, C) o miga con puertas (B); índice de la página en el muelle de `GPageHeader` |
| Claro / oscuro / sistema | `data-theme` antes de pintar (script del `<head>`, como hoy); preferencia guardada |
| Idioma | Cambia a la **misma ruta** del otro idioma; `lang` y `hreflang` en los enlaces |
| 404 | Mismo marco, sin miga, con búsqueda abierta a mano |

## 5. Teclado y foco

- **Primer Tab: «Saltar al contenido»** (`GAppShell`, `labels.skip`) → `main`. Límite de WebKit (Safari no tabula enlaces por defecto, S7 de app-shell).
- **`/`** abre la búsqueda (fuera de un campo editable; `aria-keyshortcuts="/"`). Se conserva **⌘K / Ctrl+K** (lo que hoy enseña VitePress).
- **Esc:** cierra la paleta (vuelve el foco al campo) o vacía el filtro (A) sin propagar; cierra el drawer.
- **Orden:** salto → banda (marca, miga, versión, búsqueda, idioma, tema) → índice global → página (`h1`, contenido) → índice de la página → pie. Nada reordenado con CSS.
- **Al navegar:** el foco va al `h1` de la página (`GPageHeader.focus()`), con el título del documento actualizado.

## 6. Anuncios

- Recuento del filtro o de la búsqueda (cortés, 600 ms, como `GCombobox`).
- Navegación de ruta: el foco en el `h1` basta (sin región viva propia).
- Cambio de tema: estado del botón (`aria-pressed`), sin anuncio.
- Fijar en la mesa (C): el botón cambia de nombre y de estado; sin región viva.

## 7. Auditoría previa del marco actual (`docs/documentacion/auditoria-visual.md` §1)

Captura del sitio construido a 1280 (`site/.vitepress/dist`, servido en 4231): barra 272 px + contenido 624 px + índice 224 px.

| Aspecto | Hallazgo |
| --- | --- |
| Estructura | Correcta (banda, barra, contenido, índice), pero **tres columnas de navegación** compiten con la ficha viva, que es el producto |
| Jerarquía | Titulares en Instrument Serif solo en el sitio; la cabecera de la ficha (estado, entrada, desde) es una línea de `code` sueltos |
| Contraste y delimitación | Medido por `site.spec.mjs` ≥ 4,5:1; el índice derecho trunca títulos largos |
| Espaciado | «GitHub –» y «⌘ K» con separaciones raras en la banda |
| Controles | Búsqueda como botón; selector de idioma por hover; tema como interruptor sin texto |
| Estados | Sin estado «sin resultados» propio del marco; la búsqueda es la de VitePress |
| Consistencia | El marco **no es Grana**: VitePress vestido con tokens (`grana-site.css`); los componentes de chasis que Grana ya tiene (`GAppShell`, `GSidebar`, `GPageHeader`, `GBreadcrumbs`, `GCombobox` en paleta) no se usan |

## 8. Solapes revisados (no duplicar)

`GAppShell` (banda, salto, reserva del sidebar, `--g-app-shell-top`), `GSidebar` (asiento #612, drawer, riel, búsqueda por slot), `GPageHeader` (zócalo, muelle, `focus()`), `GBreadcrumbs` (puertas a hermanos, etapas líquidas), `GCombobox appearance="palette"` (vista previa con `GSummary`), `GMenu` (elementos-enlace, `lang`/`hreflang`/`current`, #743), `GContainer` (`reading`, `prose`, sangrado), `GSplit` (`sticky` reservado con condiciones), `GBadge`, `GBtn`, `GIcon`, `GText`, `GHero` y los bloques `GbFooter`, `GbFeatures`. Inventario completo de piezas del sitio sin componente: `inventario-componentes.md`.
