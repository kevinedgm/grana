# Brief — consulta de reserva (propuesta `GBookingBar`) y campo de grupo (propuesta `GPartyField`), r01

> kiwi, 2026-10-21. Encargo: inventario de primitivas de marketing (`design/lab/marketing/r01/`), prioridad 3 de las que tienen forma visible. Plantillas de destino: hotel boutique, restaurante y tour operador en Oaxaca, construidas con Grana (temas rústico, minimalista y lujo; WCAG 2.2 AA; rápidas).

## Problema

En un sitio de hotel, restaurante o tour, la conversión depende de una sola pieza: **la consulta** («¿hay sitio para nosotros ese día?»). Hoy Grana tiene todos los campos que la forman (`GDatePicker` con rango y slot `trigger`, `GTimeField`, `GNumberField` con −/+, `GSelect`, `GRadioGroup`, `GForm`), pero no la pieza que los compone en una consulta compacta, ni el **contador de personas por tipo** (adultos, niños, habitaciones) que todos los motores de reserva piden. Cada sitio la reharía a mano, con los errores de siempre: barra que se parte en dos filas en tableta, campos sin etiqueta visible, contador que no se maneja con teclado, error que no dice qué falta, móvil con cuatro cajas apiladas.

**Grana no hace la reserva.** No hace `fetch` ni conoce el motor (Cloudbeds, SiteMinder, una hoja de WhatsApp): la consulta **emite un objeto de intención** y la aplicación arma el enlace profundo o el mensaje.

## Quién lo usa

- **Huésped en el móvil** (la mayoría del tráfico de un hotel boutique): una mano, buena luz o no, mira la página entera antes de decidir; quiere saber si hay sitio sin rellenar un formulario.
- **Comensal que quiere mesa para hoy**: su pregunta es «¿para 2, hoy, a las 8 y media?»; las horas llenas deben verse antes de elegir.
- **Viajero que compara fechas para un tour**: el recorrido sale solo ciertos días; quiere ver cuáles antes de elegir.
- **Quien integra** (la agencia que vende el sitio): quiere un componente que se configure por plantilla y le dé un objeto limpio para su motor.
- **Teclado, lector de pantalla, baja visión (zoom 200–400 %), movimiento reducido, `forced-colors`, RTL.**

## Alcance

1. **Base funcional**: formulario de búsqueda con nombre, etiquetas, resumen legible («13–15 nov · 2 noches · 2 adultos · 1 habitación»), validación al enviar, foco al primer error, anuncios, objeto de intención, ocultos con nombre (envío nativo), forma compacta que abre una hoja, deshabilitado, días no disponibles, RTL, 320 px, 400 %, `forced-colors`, movimiento reducido. Tres plantillas: hotel (llegada–salida, huéspedes, habitaciones), restaurante (día, hora, personas), tour (recorrido, fecha, personas).
2. **Campo de grupo**: cantidades por tipo con − n + en un popover no modal; decidir si es parte de la barra o primitiva.
3. **Conceptos divergentes A/B/C** con los tokens reales del tema por defecto y los componentes reales de `dist/`.

**Fuera:** precios y tarifas (moneda reservada a la Fase 5, #154), disponibilidad en vivo, pago, edades de los niños (anotado como reservado), varias habitaciones con ocupación distinta.

## Solapes revisados (para no duplicar)

| Existente | Qué aporta | Qué falta para la consulta |
| --- | --- | --- |
| `GDatePicker` (`datepicker.md`) | Rango con un solo valor completo, `split` (Desde/Hasta), `disabledDates`, `min`, hoja móvil propia, **slot `trigger`** (pensado para «un segmento de una barra de búsqueda», #63), slot `day` (precio bajo el número), `proximity` (± días) | La noche agotada ≠ el día de salida (hallazgo B-L5); su raíz es bloque y no cabe en una frase (B-L7); la navegación de mes sigue activa en línea con `disabled` (B-L6) |
| `GTimeField` (`time-field.md`) | Hora escrita como se dice, `min`/`max`/`step`, 12/24 h | En restaurante, las horas son **turnos** de la aplicación (con llenos): mejor `GRadioGroup chip` en A y C |
| `GNumberField` (`number-field.md`) | `spinbutton` con −/+ (`steppers`), `min`/`max`, flechas, repetición | Es una sola cifra: el grupo por tipo (adultos/niños/habitaciones), su resumen y su popover no existen |
| `GSelect` / `GCombobox` | Elegir el recorrido (pocos: `GSelect`; muchos: `GCombobox`, entrada propia) | Nada: se compone |
| `GRadioGroup` `appearance="chip"` | Turnos de hora y días rápidos (hoy/mañana) con opciones deshabilitadas | Nada: se compone |
| `GForm` + `GFormRow` | Revelado de errores, foco al primero, `GErrorSummary`, filas que llenan el ancho | `GFormRow` parte la fila en columna; la consulta **no se parte**: o cabe en una fila o se vuelve resumen + hoja (decisión 4) |
| `GDialog` | Hoja modal con foco atrapado y devuelto | Se compone para la hoja de la forma compacta (el prototipo usa `<dialog>` nativo) |
| `GPageHeader` (muelle en estrecho, #630) y `GFab` (`EDGE_ORDER.fab`) | Patrón de muelle inferior y registro de bordes | El muelle de B necesita su lugar en `edgeReserve` (B-L10) |
| `GCard` | Las ofertas (habitación, plato, tour) | «Las fechas viajan» a las ofertas es de la aplicación (B) |

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1 y §3; es un formulario)

No hay vista existente que auditar en Grana: la referencia es la barra genérica de las agencias en línea y la composición a mano con los campos actuales. Lo que se exige al prototipo y cómo se resuelve:

| Aspecto | Riesgo en la composición a mano | Exigencia para la ronda |
| --- | --- | --- |
| Estructura | Campos sueltos sobre la foto, sin relación con su sección | Una sola superficie (`surface`, borde, `shadow-2`, `radius-lg`) con título propio y el botón dentro; nada flota |
| Jerarquía | El botón compite con el título del sitio | Título del sitio (`display`) › título de la consulta (body 600) › etiquetas (body-sm 500) › resumen (body-sm `muted`); una sola acción sólida |
| Contraste y delimitación | Campos sobre foto sin borde de control | La consulta va sobre `surface`, nunca directamente sobre la foto; cajas con `border-control` (≥ 3:1) |
| Espaciado | Literales por breakpoint | Solo `space` (separación `space-3`, relleno `space-4`), sin literales salvo 24/44 |
| Controles | Contador con «−/+» de 16 px y sin teclado | `GNumberField` real (flechas, área 24/44 px); popover con Esc, Tab y toque fuera |
| Formularios | Placeholders como etiqueta; error en rojo sin texto | Etiqueta visible (o rótulo oculto + valor visible en A), mensaje que dice qué hacer, foco al primero, anuncio cortés |
| Estados | Sin vacío, enviando ni deshabilitado | Vacío, parcial, inválido (incl. noche agotada), enviando (`loading` con texto), enviado, deshabilitado, días no disponibles |
| Consistencia | Contador propio, estilos duplicados | Campos reales de Grana; solo el contador por tipo y el popover son del prototipo |
