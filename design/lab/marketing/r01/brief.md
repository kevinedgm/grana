# Brief — primitivas de marketing (inventario), r01

> kiwi, 2026-10-21. Encargo del usuario: vender sitios web premium a **hoteles boutique, restaurantes y tour operators de Oaxaca** construidos con Grana (temas por tokens: rústico, minimalista, lujo; accesibles WCAG 2.2 AA; rápidos). Grana hoy está hecha para interfaces de gestión; faltan primitivas de marketing. Esta carpeta es el **inventario** (qué falta de verdad, qué es componente y qué es receta, con prioridad) y el material común de las tres rondas que salen de él. No hay prototipo propio: los prototipos están en `design/lab/hero/r01/`, `design/lab/gallery/r01/` y `design/lab/booking-bar/r01/`.

## Usuario final y tarea

| Plantilla | Quién llega | Qué quiere en la primera visita | Qué le hace irse |
| --- | --- | --- | --- |
| **Hotel boutique** | Viajero nacional o extranjero, en el **teléfono**, desde Instagram, Google Maps o un buscador | Ver el lugar (habitación, baño, vista), saber el precio aproximado y si hay fechas; reservar directo (no por la OTA) | Fotos pequeñas o que no se pueden ver bien; no encontrar «Reservar»; un motor de reservas que abre en otra web sin avisar |
| **Restaurante** | Comensal local o turista, a menudo **el mismo día**, en el teléfono | La carta con precios, el horario, cómo llegar, mesa para hoy | Carta en PDF; horario escondido; WhatsApp como único canal sin decirlo |
| **Tour operator** | Viajero que compara recorridos, en escritorio o teléfono | Qué incluye, cuánto dura, punto de encuentro, fecha y precio por persona, opiniones | No saber qué incluye; no ver fechas; testimonios sin fuente |

Necesidades transversales: lector de pantalla, zoom, movimiento reducido, **inglés además de español**, conexión móvil lenta (fotos pesadas), sol de frente (contraste), un dueño que cambia fotos y textos sin saber de diseño.

## Lo que ya existe y no se rehace

`GAppShell`, `GContainer`, `GSection`, `GStack`, `GCard`, `GCardGroup`, `GTabs`, `GAccordion`, `GBreadcrumbs`, `GDatePicker`/`GCalendar`, `GFab`, `GForm` y campos (`GInput`, `GTextarea`, `GSelect`, `GCombobox`, `GNumberField`, `GTimeField`, `GCheckbox`, `GRadioGroup`, `GSwitch`, `GSlider`), `GPageHeader`, `GAvatar`, `GTag`, `GBadge`, `GEmpty`/`GLoadRegion`, `GDialog`, `GMenu` (con elementos-enlace, #571 a #579), `GTooltip`, `GHelper`, `GToast`, `GSurface` con zona de marca (#620 a #625), `GIcon` público, `GDivider`, `GDocumentPreview` (en curso).

Revisados para el inventario: `card.md` (media `top`/`start`/`end`/`background`/`inline`, velo `--g-card-scrim`, enlace de toda la tarjeta, metadatos, acciones), `card-group.md`, `page-header.md`, `surface.md` §«Zona de marca», `container.md`, `app-shell.md`, `menu.md` §«Elementos-enlace», `datepicker.md` (rango), `number-field.md`, `time-field.md`, `combobox.md`, `document-preview.md`, `icons.md` (lista de la librería) y DECISIONS #154 (la moneda va en una ronda propia, Fase 5).

## Auditoría previa (`docs/documentacion/auditoria-visual.md`)

La regla nace para vistas de gestión; aquí se aplica a **páginas de marketing compuestas con componentes de Grana**: cada ronda (`hero`, `gallery`, `booking-bar`) lleva la suya en su `brief.md` contra el patrón habitual de los frameworks. Lo común que se encontró y que las tres resuelven igual:

| Aspecto | Patrón habitual de marketing | Criterio de Grana para las tres rondas |
| --- | --- | --- |
| Estructura | `div` decorativos, títulos que no son encabezados, dos `h1` | Regiones nombradas, un solo `h1` (el del héroe), listas y formularios nativos |
| Contraste | Texto blanco sobre foto con degradado | Texto nunca sobre una foto sin placa opaca; zona de marca para la identidad |
| Movimiento | Carruseles con autoavance, vídeo sin pausa, aparición al desplazar | Nada se mueve solo sin pausa (2.2.2); sin autoavance; movimiento reducido = quieto |
| Controles | Puntos y flechas de 8–16 px sobre la foto | ≥ 24 px (44 px táctil), con nombre, fuera del texto |
| Estados | Sin carga, sin error de foto, sin vacío | Marcador del tamaño final, `alt` si falla, estados del formulario de consulta |
| Consistencia | Estilos propios por plantilla | Solo tokens; los tres temas (rústico, minimalista, lujo) son temas del CLI, no CSS por plantilla |
| Rendimiento | Foto del héroe diferida o de fondo CSS; galerías que descargan todo | Una sola foto prioritaria; miniaturas diferidas con tamaño reservado |
