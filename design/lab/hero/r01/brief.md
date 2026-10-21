# Brief — héroe de marketing (`GHero`), r01

> kiwi, 2026-10-21. Encargo: primitivas de marketing para sitios de hoteles boutique, restaurantes y tour operators de Oaxaca construidos con Grana (inventario en `design/lab/marketing/r01/`). El héroe es la **prioridad 1** del inventario.

## Problema

La primera pantalla de un sitio de hotel, restaurante o recorrido decide si la persona sigue o se va. Hoy Grana no tiene pieza para ella: `GPageHeader` es el encabezado de una página de **gestión** (zócalo pegado, migas, acciones de registro) y `GCard mediaPosition="background"` es una tarjeta, no la apertura de una página. Cada sitio la escribiría a mano, y la receta habitual (foto a pantalla completa con texto blanco encima y un degradado) falla en tres sitios que un sitio de marketing no se puede permitir:

1. **Contraste no garantizable.** El dueño del hotel cambia la foto cuando quiere; el texto encima pasa de 7:1 a 1,3:1 sin que nadie lo note (WCAG 1.4.3). Un degradado fijo no lo arregla: depende de la foto.
2. **Rendimiento de la primera pintura (LCP).** La foto del héroe es el elemento más grande; si va con `loading="lazy"`, como fondo CSS o detrás de un carrusel, llega tarde.
3. **Movimiento impuesto.** Carruseles que avanzan solos y vídeos de fondo sin pausa (WCAG 2.2.2), en el móvil de alguien que solo quería ver el precio.

## Quién lo usa

- **Huésped / comensal / viajero** (usuario final): llega desde Instagram o Google Maps en el **teléfono**, a menudo con datos móviles y sol de frente; quiere saber en 3 segundos qué es, dónde está y cómo reservar. Una parte usa lector de pantalla, zoom o movimiento reducido; una parte llega desde el extranjero (inglés; RTL improbable pero el contrato de Grana lo exige).
- **Dueño del negocio**: cambia la foto y el texto desde un panel; no sabe de contraste.
- **Quien integra** (el usuario de Grana que vende el sitio): quiere tres plantillas (hotel, restaurante, tour) con tres temas (rústico, minimalista, lujo) sin reescribir la apertura.

## Alcance

Base funcional (semántica, un solo `h1`, foto prioritaria, acción principal, pausa del movimiento, reflujo, RTL, `forced-colors`, movimiento reducido) y **tres conceptos de forma** con los tokens reales del tema por defecto y dos temas de muestra. **Fuera:** la barra de consulta (ronda propia, `design/lab/booking-bar/r01/`; C reserva su hueco), la galería (`design/lab/gallery/r01/`), la cabecera del sitio (es de la aplicación: `GAppShell` + receta) y los vídeos reales (simulados con un movimiento lento de la foto).

## Solapes revisados (no duplicar)

| Existente | Qué cubre | Por qué no basta | Relación propuesta |
| --- | --- | --- | --- |
| `GPageHeader` (#626 a #634) | `h1`, contexto, acciones de una página de **aplicación**; zócalo pegado, muelle en estrecho, zona de marca | No tiene media, no es la apertura de un sitio, se pega (un héroe no se pega) | Frontera escrita: `GPageHeader` = página de trabajo; `GHero` = apertura de un sitio. Comparten la regla del `h1` único y la acción principal en tinta invertida dentro de la zona |
| `GCard` `mediaPosition="background"` + `--g-card-scrim` | Media con velo bajo el texto | Es exactamente el patrón que la base descarta para el héroe (contraste dependiente de la foto); es una tarjeta (`article`, `h3`) | Ninguna: el héroe no usa el velo |
| `GSurface zone="brand"` / `data-g-zone="brand"` (#620 a #625) | Un ámbito que redeclara el grupo de color contra la marca | — | **Se reutiliza tal cual** como placa de B: el contraste de la placa lo garantiza el CLI |
| `GContainer` (#721, #722) | Columna de página, sangrado `g-bleed` | El héroe no es una columna | El héroe se pone **dentro o fuera** del contenedor; su margen respira con `cqi` como el del contenedor |
| `GAppShell` (#708 a #717) | Cabecera de aplicación pegada | — | El héroe va en el `main` del chasis; no se mete debajo de la cabecera (ver H-L6) |
| `GBtn` | Acciones | — | Se reutiliza (tamaño `lg`, 44 px) |

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1 y §3) sobre la receta habitual de héroe

No hay héroe en el repositorio; se audita el patrón común de los frameworks (foto a sangre + texto blanco centrado + degradado + carrusel) contra la regla, adaptada a una vista de marketing.

| Aspecto | Observado en el patrón habitual | Valoración | Lo que hace la base |
| --- | --- | --- | --- |
| Estructura | `div` con fondo CSS; el título a veces es un `div`, a veces hay dos `h1` (logo y héroe) | No cumple 1.3.1 | `section` nombrada por su `h1` único; foto como `img` en el DOM |
| Jerarquía | Eyebrow, título y bajada del mismo color sobre la foto; la acción secundaria compite con la principal (dos botones sólidos) | Ambigua | Eyebrow caption `muted`, título display fluido, bajada title-sm `muted`; principal sólida, secundaria contorno o enlace |
| Contraste y delimitación | Texto sobre foto con degradado fijo; la foto clara lo rompe | No cumple 1.4.3 de forma garantizable | **El texto nunca va sobre la foto sin una placa opaca** (medido con las fotos extremas `cielo`, `noche` y `papel-picado`) |
| Espaciado | Literales por punto de corte (`py-24 md:py-32`) | No sigue a `space` | Solo `space`; margen por `cqi` sin puntos de corte |
| Controles | Flechas del carrusel sobre la foto, sin nombre; puntos de 8 px | No cumple 2.5.8 ni 4.1.2 | Sin carrusel; vistas como radios con nombre de 44 px (B); pausa con texto (base) |
| Estados | Sin estado de carga de la foto ni de foto rota; movimiento sin pausa | No cumple 2.2.2 | Pausa visible siempre que haya movimiento; reducido = quieto; marcador con el tono de la superficie mientras llega la foto |
| Consistencia | Colores, sombras y radios propios | — | Solo tokens del tema; zona de marca real |
| Rendimiento | Foto de fondo CSS o `lazy`; carrusel que descarga todas | LCP tardío | `img` `eager` + `fetchpriority="high"` + `width`/`height`; una sola prioritaria |
| Reflujo | `height: 100vh` que recorta el texto a 400 % y con la barra del navegador móvil | No cumple 1.4.10 | `min-block-size` y `svh`; el héroe crece con su contenido (medido a 320×256) |
