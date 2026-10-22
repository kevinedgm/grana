# Declaración — primitivas de marketing (inventario), r01

> kiwi, 2026-10-21. **Estado: en revisión** (el inventario y la frontera componente/receta derivan de los contratos vigentes y se aprueban solos; la forma de cada componente es decisión del usuario, con una pregunta por ronda). Material común: `fotos.js` (marcadores de fotografía locales, sin recursos externos, con tres fotos extremas para medir contraste: `cielo`, `noche`, `papel-picado`). Rondas que salen de aquí: **`design/lab/hero/r01/`** (767/767), **`design/lab/gallery/r01/`** (434/434) y **`design/lab/booking-bar/r01/`** (413/413), las tres en Chromium, Firefox y WebKit y repetidas sobre el `dist/` reconstruido por otra sesión a las 11:58.

## 1. Qué necesita cada plantilla

| Bloque de la página | Hotel | Restaurante | Tour | Con qué se arma |
| --- | --- | --- | --- | --- |
| Cabecera del sitio y navegación | Sí | Sí | Sí | `GAppShell` (cabecera + pie) + receta (ver §3, R1) |
| Apertura con foto y acción | Sí | Sí | Sí | **Falta: `GHero`** |
| Fotos del lugar, platos o recorrido, con visor | Sí | Sí | Sí | **Falta: `GGallery`** (+ visor) |
| Consulta rápida (fechas, hora, personas) | Sí | Sí | Sí | **Falta: `GBookingBar`** (+ `GPartyField`) |
| Habitaciones / platos / recorridos con precio y acción | Sí | Sí | Sí | `GCard` + `GCardGroup` (receta) — **falta el precio** (§4, M-L1) |
| Opiniones | Sí | Sí | Sí | `GCard` + `figure/blockquote` + `GAvatar` (receta) |
| Llamada a la acción a media página | Sí | Sí | Sí | `GSection` + `GContainer` + zona de marca + `GBtn` (receta) |
| Ubicación y cómo llegar | Sí | Sí | Sí (punto de encuentro) | `GCard` + `<address>` + enlace externo (receta); la incrustación de mapa, ronda futura (`GEmbed`) |
| Selector de idioma | Sí | Sí | Sí | `GMenu` con elementos-enlace (receta) — **falta `lang`/`hreflang`** (M-L3) |
| Preguntas frecuentes | Sí | — | Sí | `GAccordion` (ya existe) |
| Itinerario por horas | — | — | Sí | `GSection` + lista ordenada (receta); `GStepper` **no** (es un proceso que se completa) |
| Carta por secciones | — | Sí | — | `GTabs` o `GSection` + lista de definiciones (receta) + precio (M-L1) |
| Contacto por WhatsApp | Sí | Sí | Sí | `GFab` (C · acción con cola) o `GBtn` con enlace externo (receta) |
| Pie con datos, redes y aviso de privacidad | Sí | Sí | Sí | `GAppShell` pie + `GStack` (receta) |

## 2. Inventario: componente o receta, y prioridad

Criterio para que algo sea **componente** (y no receta): (a) tiene un comportamiento de accesibilidad que una receta suele romper (teclado compuesto, modal, foco devuelto, contraste garantizable, pausa del movimiento); o (b) coordina varios componentes con un estado propio; o (c) sin él cada sitio reescribe la misma pieza de forma distinta. Si solo es colocar componentes existentes, es **receta** (la documenta mora-docs cuando haya plantillas).

| # | Candidata | Decisión | Por qué | Solape revisado | Prioridad |
| --- | --- | --- | --- | --- | --- |
| 1 | **Héroe** | **Componente `GHero`** — ronda `hero/r01` | (a) contraste que la receta rompe con cualquier foto nueva, LCP (una sola foto prioritaria), pausa del vídeo (2.2.2); (c) todas las páginas de las tres plantillas abren con él | `GPageHeader` (página de aplicación, se pega, sin media); `GCard media="background"` (tarjeta con velo, que la base descarta) | **1** |
| 2 | **Galería con visor** (y carrusel) | **Componente `GGallery`** (+ visor exportable `GGalleryViewer`) — ronda `gallery/r01`. **El carrusel con autoavance se descarta**; la «tira» desplazable entra como apariencia (B) | (a) visor modal con foco devuelto a la foto vista, teclado APG, gestos con equivalente, contador anunciado; (c) hotel y restaurante viven de sus fotos | `GDocumentPreview` (documentos con páginas, lomo y acciones con acuse; no fotos), `GDialog` (se apoya en él: G-L3), `GCard media` | **2** |
| 3 | **Barra de reserva / consulta rápida** | **Componente `GBookingBar`** + primitiva **`GPartyField`** (personas por tipo) — ronda `booking-bar/r01` | (b) coordina fecha/rango, hora y personas con un resumen y una forma compacta; sin `fetch`: emite un objeto de intención y la aplicación arma el enlace a su motor o a WhatsApp; el contador por tipo no existe | `GDatePicker` (rango), `GTimeField`, `GNumberField`, `GSelect`/`GCombobox`, `GForm`: se **componen**, no se rehacen | **3** |
| 4 | Tarjeta de oferta (habitación, plato, recorrido) | **Receta de `GCard`** (media `top`, título, metadatos, `GBadge`, acciones, enlace de toda la tarjeta) en `GCardGroup` | `GCard` ya cubre las doce composiciones (#123 a #125); lo único que falta es **el precio** («desde $1 850 MXN / noche»), que es la ronda de moneda (#154) y no una tarjeta nueva | `GCard`, `GSummary` (ficha de datos, no oferta) | 4 (bloqueada por M-L1) |
| 5 | Banda de llamada a la acción | **Receta**: `GSection` + `GContainer` + `data-g-zone="brand"` + `GBtn` | La zona de marca ya garantiza contraste e invierte la acción principal (§44.1) | `GSurface zone`, `GPageHeader` en zona | 5 |
| 6 | Selector de idioma | **Receta de `GMenu`** con elementos-enlace (cada idioma es una página: `href`, no `select`) | Ya existe el patrón (#571 a #579); falta solo `lang`/`hreflang` en el elemento (M-L3) | `GSelect` (no: cambiar de idioma es navegar), `GRadioGroup` | 5 |
| 7 | Opiniones / testimonios | **Receta**: `GCard` con `figure > blockquote + figcaption` y `GAvatar`; la calificación como texto («4,8 de 5 · 312 opiniones en Google») | Sin carrusel; la fuente siempre visible (credibilidad); las estrellas necesitarían el icono `star` (M-L2) | `GCard`, `GAvatar`, `GCardGroup` | 6 |
| 8 | Ubicación / mapa | **Receta** ahora: `GCard` con la imagen estática del mapa que aporta la aplicación, `<address>`, horario y «Cómo llegar» con marca de enlace externo (#574). **Ronda futura `GEmbed`**: fachada de carga a petición para mapas y vídeos de terceros | Un componente «mapa» sin `fetch` ni globals no añade nada sobre una imagen + enlace; lo que sí añade valor es **no cargar el iframe de terceros** (cookies, peso) hasta que la persona lo pida, con su texto de privacidad | `GCard media`, `GDocumentPreview` (no) | 7 |
| 9 | Navegación del sitio (barra superior con menú en móvil) | **Receta** sobre `GAppShell` (cabecera) + enlaces + `GSidebar` en `drawer` para el teléfono | Revisar en la primera plantilla real si `GSidebar` como cajón de un sitio de marketing basta; si no, ronda propia | `GSidebar`, `GAppShell` | 8 (ver M-L5) |

**Orden de trabajo propuesto:** las tres rondas de esta entrega (héroe → galería → consulta, en paralelo para lima) → ronda de **moneda y precio** (#154; desbloquea la tarjeta de oferta y la carta) → `GEmbed` → plantillas (recetas documentadas, con los tres temas del CLI).

## 3. Recetas: notas para cuando se documenten

- **R1 · Cabecera del sitio.** `GAppShell` con slot `header`: logo como enlace a inicio (no `h1`; el `h1` es del héroe), navegación con `nav` nombrada, acción «Reservar» como `GBtn` que lleva a la consulta, selector de idioma (R6). Sin cabecera transparente sobre el héroe en esta entrega (H-L6).
- **R4 · Oferta.** `GCard interaction="link"` con media `top`, `eyebrow` (tipo de habitación), título, metadatos (capacidad, m², cama), precio en el pie (cuando exista, M-L1) y una acción secundaria («Ver fotos» abre `GGalleryViewer`, G-L1).
- **R5 · Banda de acción.** Una sola por página además del héroe (la zona cuenta como el sólido de marca de la vista, §2 de `tokens.md`).
- **R7 · Opiniones.** `blockquote` con `cite` a la fuente cuando es pública; el nombre y el origen en `figcaption`; nunca opiniones inventadas ni sin fuente (esto lo cuida la plantilla, no Grana).
- **R8 · Ubicación.** `<address>` real; «Cómo llegar» con `target="_blank"` y la marca de `GMenu`/`GCard` de enlace externo; el mapa estático con `alt` que describe el lugar («A dos calles de Santo Domingo, esquina con Alcalá»), no «mapa».

## 4. Hallazgos para lima (transversales; los de cada componente están en su ronda: H-L, G-L, B-L)

- **M-L1 · Precio y moneda.** Las tres plantillas muestran precios («desde», «por noche», «por persona», «MXN»/«USD»). Es la ronda de moneda de la Fase 5 (#154). Propuesta: adelantarla y que produzca una pieza de **solo lectura** (`GPrice` o una utilidad `formatPrice` con `Intl.NumberFormat`) además del campo de entrada, para que la oferta, la carta, la consulta (precio por día en el calendario, B-L8) y la galería en línea (C de la galería) compartan una regla.
- **M-L2 · Iconos que faltan para recetas.** `star` (calificación), `utensils` (restaurante), `bed-double` (habitación), `clock` (horario), `map` (ubicación) — solo si las recetas los piden; ninguno lo necesita la base de las tres rondas (G-L8: la galería no necesita ninguno; B-L9: la consulta, `clock`, `ticket` y `map`, opcionales).
- **M-L3 · `lang` y `hreflang` en elementos-enlace de `GMenu`.** Para el selector de idioma: cada elemento con `lang` (el nombre del idioma en su idioma, «English», para que el lector lo pronuncie bien, WCAG 3.1.2) y `hreflang`. Hoy `menu.md` solo admite `target` y `rel` (§«Elementos-enlace»).
- **M-L4 · Paquete.** Héroe (casi solo CSS en A), galería (visor, gestos) y consulta (compone campos pesados) tienen pesos muy distintos. Propuesta para valorar con #506: el héroe en el principal con compuerta (≤ 1 KiB) y la galería y la consulta en entradas propias (`@grana/vue/gallery`, `@grana/vue/booking`), o una entrada `@grana/vue/marketing` común si el usuario prefiere una sola importación para sitios.
- **M-L5 · Temas rústico, minimalista y lujo.** Los tres deberían salir del CLI (`grana theme`) como **ejemplos de configuración** (no CSS a mano): el prototipo del héroe los simula a mano y deja ver que `--g-font-display` serif y los radios 0 bastan para «lujo». Propuesta para el CLI y la documentación, no para los componentes.
- **M-L6 · Título de marketing.** La escala acaba en `display` 39 px; el héroe propone un título fluido (H-L3). Si se adopta, la galería y la banda de acción podrían usarlo.
- **M-L7 · Personalidad registrada.** Cuando el usuario elija, registrar en `DECISIONS.md` la personalidad de cada uno (regla de lima): héroe (forma de lugar / vistas elegidas / reserva en el umbral), galería (recorrido por espacios / tira / en su sitio), consulta (la frase / el muelle / el conserje).

## 5. Qué lo hace distinto (del conjunto)

Primitivas de marketing que **no aceptan los atajos del marketing**: ninguna foto puede romper el contraste del texto, nada avanza ni se mueve solo sin poder pararse, la foto que importa llega primero, el visor devuelve a la persona a la foto que estaba viendo y la consulta se dice como una frase («Llego el viernes, me quedo dos noches y somos dos adultos») en vez de un formulario de cuatro cajas. Grana no sabe de reservas, mapas ni motores: presenta, garantiza el acceso y **emite intención**; el sitio decide adónde va.

## 6. Preguntas para el usuario

Tres, una por ronda (cada una en su `declaracion.md`, con la recomendación primero):

1. **Héroe** (`design/lab/hero/r01/declaracion.md`): recomendado **Base + A · La ventana por defecto, con C · El umbral y B · Vistas a elegir como apariencias**.
2. **Galería** (`design/lab/gallery/r01/declaracion.md`): recomendado **Base + A · El recorrido por espacios (cuando las fotos traen grupo), con B · La tira como apariencia y C · Se abre en su sitio reservada**.
3. **Consulta** (`design/lab/booking-bar/r01/declaracion.md`): recomendado **A · La frase por defecto, la barra de la base como apariencia y B · El muelle como opción; C · El conserje reservado**.

Y una de alcance, que no bloquea: **¿adelantamos la ronda de moneda y precio (#154) para desbloquear la tarjeta de oferta y la carta?** (recomendado: sí, justo después de estas tres).

## Comprobaciones

- Inventario: hecho leyendo los contratos citados en `brief.md`; no hay prototipo propio.
- `fotos.js`: lo cargan los tres prototipos sin errores de consola (medido en sus verificaciones).
- Las tres rondas, repetidas el 2026-10-21 sobre el `dist/` actual: héroe 767/767 (puerto 4231), galería 434/434 (4232), consulta 413/413 (4233).
- **No verificado:** nada en entorno real (lector de pantalla, teléfono, conexión lenta, fotos reales con `srcset`); los tres temas derivados por el CLI; las recetas de §3 (son notas, no prototipos).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** se revisó todo lo existente antes de proponer y solo entran tres componentes y una primitiva (`GPartyField`); el resto son recetas sobre componentes vigentes; las tres rondas aplican la auditoría previa y la rúbrica de movimiento, entregan base + A/B/C con los tokens reales y cierran con una pregunta.

**Correcciones:** frente al encargo, el **carrusel** no entra como componente (autoavance descartado por 2.2.2; la tira de la galería lo sustituye) y el **mapa** no es componente (sin `fetch` no aporta nada sobre una imagen y un enlace; lo que aporta valor es la fachada `GEmbed`, ronda futura).

**Pendientes:** las tres elecciones del usuario y la de alcance; lima: M-L1 a M-L7 y los hallazgos de cada ronda; las recetas de §3, cuando haya plantillas (mora-docs); lo no verificado de arriba.
