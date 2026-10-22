# Auditoría · GAppShell (paso 5, coco)

**Componente:** `GAppShell` (`GAppShell.vue` de bruno, 199f170; entrada `@grana/vue/app-shell`) sobre `GAppShell.css` (coco, 2971e33) y `app-shell.md` (lima, 86297b9, #708 a #718) · **Fecha:** 2026-10-21 · **Resultado:** sin defecto bloqueante → **`candidate`**

**Verificación propia:** `GRANA_PW_PORT=4215 node design/lab/app-shell/auditoria-verificar.mjs` (requiere `npm run build`; utilidades en `auditoria-comun.mjs`, compartidas con las auditorías de `GContainer`, `GStack` y `GSection`). Monta el **componente real** en el banco de bruno `packages/vue/playground/app-shell.html` (con `GSidebar`, `GPageHeader`, `GContainer`, `GStack`, `GSection`, `GAccordion`, `GToaster` y `GStatusIsland` reales de `dist/`, sin receta de cabecera ni `offset.top`), con temas inyectados sin capa después de `grana.css`, como el tema de una aplicación.

| Motor | Comprobaciones |
| --- | --- |
| Chromium | 302/302 |
| Firefox | 299/299 |
| WebKit | 299/299 |
| **Total** | **900/900** |

Además, los specs de bruno sobre el estado final (`GRANA_PW_PORT=4217 npx playwright test tests/app-shell.spec.mjs tests/app-shell-perf.spec.mjs tests/container.spec.mjs tests/stack-section.spec.mjs`, tres motores): **196 pasan, 2 omitidos por diseño** (`forced-colors` solo en Chromium); aquí cuentan `app-shell.spec.mjs` y `app-shell-perf.spec.mjs`.

**Temas:** por defecto (claro y oscuro), `spotify` y `medium` de `design/lab/tema-oscuro/dark-color-presence/generated/` (claro y oscuro), `spotify`, `stripe` y `grana` derivados **en el momento** por `@grana/cli` desde `…/themes/*.json` (claro y oscuro; los CSS de `generated/` son anteriores a la zona de marca y no traen `--g-color-brand-zone`), y el tema de prueba (`space` 5, `--g-font-title` serif, borde de 2 px; claro y oscuro). Zona de marca en la banda (`headerZone="brand"`) en todos ellos. Capturas: `auditoria-A.png`, `auditoria-B.png` (prototipo r01 de kiwi ↔ componente real) y `auditoria-zona.png`.

## Auditoría previa (lo que se revisó antes de medir)

- **Estructura:** banda de cabecera → navegación fija → marco con `main` y pie. La cabecera de la aplicación, el encabezado de la página (`GPageHeader` en `main`) y el contenido se distinguen por posición y por un borde real, sin superficies extra. Nada flota: el sidebar es una columna del visor, la banda una franja, el pie cierra el marco.
- **Componentes reutilizados:** `GSidebar` (su forma decide la reserva), `GPageHeader` (zócalo pegado), `GContainer` (columna), `edgeReserve` (bordes compartidos). El chasis no reconstruye ninguno.
- **Tokens:** solo los de «Tokens consumidos» (`app-shell.md`, `tokens.md` §48); ningún token nuevo, nada en `defaults.css`.
- **Riesgos conocidos al empezar:** S1 (enfocar lo pegado desplaza la página en Chromium y WebKit), el foco hacia la banda cedida en B, la espera de A al montar, el presupuesto del cuarto a 320×256, el canal `appShellKey` frente a mi `XAppShell` del banco de estilo.

## Auditoría posterior

| Aspecto | Estado | Evidencia (componente real, tres motores) |
| --- | --- | --- |
| Jerarquía y estructura | Cumple | Landmarks `banner`, `navigation "Principal"`, un solo `main`, `contentinfo` (árbol de accesibilidad); orden del DOM = lectura = Tab |
| Salto (2.4.1) | Cumple | Primer Tab (Opción+Tab en WebKit) → cuelga en 0, ≥ 24 px, texto «Saltar al contenido», anillo por dentro; Intro → foco en `main` sin anillo y sin cambiar el `hash`; el siguiente Tab cae en la página |
| Reserva por forma | Cumple | Expandida 264, riel 64, riel superpuesto 64 (la expansión crece encima y sigue fija tras desplazar, S2), flotante 288 / 88, drawer 0, navbar 0 con 68 al final del marco y publicado abajo (68); el pie termina encima de la barra |
| Cifra y receta | Cumple | Banda 56, `--g-page-header-top` 56, acordeón 104, `scroll-padding` 104; `--g-app-shell-header: 72` en `:root` → 72 / 72 / 120; sin cabecera → 0 y 48; zócalo sin `sticky` → 56; tema de prueba (`space` 5) → banda 70 y `scroll-padding` 130 |
| Presupuesto del cuarto (1.4.10) | Cumple | 1440×900 y 800×430 pegada; 800×400 y 320×256 despegada; lo pegado ≤ 25 % del visor en los cuatro (320×256: 48 px, 19 %); sin desplazamiento horizontal; el foco lejano queda visible a 320×256 |
| S1 (#715) | Cumple | Con la página en 1200, enfocar el botón de contraer, un enlace del sidebar, los dos botones de la banda, las dos acciones del zócalo y la pestaña del zócalo, y Mayús+Tab ×3 desde el zócalo: **Δ0 en los tres motores, con `pinned` y con `relay`** |
| `GAccordion sticky` dentro | Cumple | Encabezado abierto pegado en 104 = `--g-accordion-sticky-top`; con B cedida, sube a 48 (solo el zócalo); enfocar su botón: Δ0; su acción queda bajo lo pegado |
| Isla y avisos sin `offset.top` (#714) | Cumple | En reposo la isla en 64 y el aviso en 122 (banda 56); desplazada, con el zócalo pegado hasta 104: isla 112, aviso 170; con B cedida, el aviso sube con el relevo y queda bajo el zócalo en 0 |
| GContainer dentro | Cumple | Una banda `g-bleed` llega al borde del marco (nunca bajo el sidebar) y su texto sigue en la columna (también en RTL) |
| Estados de interacción | Cumple | Foco visible en el salto, en los botones de la banda (también en la zona de marca, ≥ 3:1) y en `main` sin anillo; ningún estado propio de hover (el chasis no es interactivo) |
| Carga, vacío, error | N/A | El chasis no carga datos; sin slot `header`/`footer` no pinta la banda ni el pie (medido) |
| RTL | Cumple | Sidebar al final del visor, cabecera y página a su izquierda, `g-bleed` a los dos bordes del marco, salto al inicio (derecha), S1 Δ0 |
| Contraste (14 temas —7 × claro/oscuro—, con y sin zona: 28 combinaciones) | Cumple | Texto de la banda, iconos de sus botones (≥ 3:1), pie `text-muted` (≥ 4,5:1), salto (texto ≥ 4,5:1, anillo ≥ 3:1), zona de marca en la banda (texto ≥ 4,5:1, iconos ≥ 3:1, anillo ≥ 3:1). El borde de la banda contra la página mide 1,17–1,19:1: es una separación decorativa sobre una banda opaca; la delimitación en `forced-colors` la da el borde real |
| `forced-colors` (Chromium) | Cumple | Borde real `solid` de la banda y del pie; el salto conserva su anillo |
| Consistencia con tokens | Cumple | Análisis estático del banco de estilo (`estilo-verificar.mjs`): sin literales de tema ni respaldos, solo los tokens del contrato, seis `@property`, espera de A acoplada a `GSidebar.css` (240 ms medidos en los tres motores, la misma `transition-duration` del sidebar) |
| Consola | Cumple | Sin errores ni avisos de Vue o de Grana en ninguna página abierta |

**Prototipo ↔ componente real** (`auditoria-A.png`, `auditoria-B.png`): misma geometría (banda 56, sidebar 264, zócalo pegado con su sombra, relevo cedido con el zócalo en 0). Diferencias de contenido del banco (pestañas en el zócalo del real, filas de relleno), no del chasis. En los dos, el `h1` de `GPageHeader` queda 24 px por dentro del texto de la página: es L4 de `GContainer`/`GPageHeader` (fuera de este lote, ver `design/lab/container/auditoria.md`).

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`), con el componente real

| Dimensión | A · Cortina | B · Relevo de franja | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Cumple | A: dos posiciones del borde de la página (264 → 64), causa-efecto visible (la navegación cubre y luego la página se aparta). B: recupera 56 px de lectura con el título y las acciones de la página siempre arriba | Bajo | — |
| B. Comodidad visual | Cumple | Cumple | A: un solo cambio de ancho; el párrafo que se lee no cambia de posición ni de alto (Δ0). B: una banda de 56 px en `--g-duration-fast` + `--g-ease-out`, sin costura (separación máxima banda/zócalo ≤ 1 px en cada cuadro al ceder y al volver) | Bajo | — |
| C. Estabilidad | Cumple | Parcial | A: objeto que se mueve sobre una referencia quieta. B: franja ancha en la periferia superior ligada al desplazamiento | Bajo (B es opción) | README (mora-docs): elegir B para lectura larga, no para paneles de trabajo |
| D. Transiciones | Cumple | Cumple | A: interrumpida a 80 ms la página no salta; parte del estado actual. B: cede y vuelve desde cualquier punto (subir 160 en dos pasos), vuelve a ceder al bajar otra vez | Bajo | — |
| E. Control | Cumple | Parcial | A la dispara la persona. B no se pide, pero vuelve al subir `space × 4`, arriba del todo, con el foco (`.focus()` y Mayús+Tab desde el sidebar) y no cede mientras el foco está dentro | Bajo | — |
| F. Accesibilidad | Cumple | Cumple | Reducido: A sin espera (la página se aparta en ≤ 60 ms), B sin cuadros intermedios; el foco nunca queda fuera de la vista (S1 Δ0; B con foco: la banda vuelve antes de pintar y Δ0); al montar, la pista reserva 264 sin espera (`is-ready`) | Bajo | — |
| G. Rendimiento | Cumple | Parcial | A: sin JS, un reflujo por cambio. B: manejador pasivo; el spec de bruno `app-shell-perf.spec.mjs` mide que el desplazamiento no vuelve a pintar el chasis (3/3 en cada motor en la pasada final) | Bajo | — |
| H. Inmersión | N/A | N/A | — | — | — |

**Resumen:** A cumple en todo; B cumple salvo estabilidad, control y rendimiento, parciales por ser movimiento ligado al desplazamiento que la aplicación elige. **Riesgos principales:** (1) B en paneles de trabajo (franja que se mueve en la periferia), opción y no defecto; (2) móvil real con la barra del navegador que se recoge (`svh`/`dvh`), no verificable aquí. **Prioridades:** ninguna corrección pendiente en el chasis. **Limitaciones:** lector de pantalla real, móvil y táctil reales, zoom real del navegador, `forced-colors` en Firefox y WebKit (no se emulan).

## Correcciones de esta auditoría

**Ninguna en `GAppShell.css`:** el CSS de la entrega de estilo (2971e33) se comporta igual con el `.vue` real que con mi `XAppShell` del banco. Las dos piezas que dependían del `.vue` (quitar `is-yielded` en `focusin` y relevo con la cifra final por `appShellKey`) cumplen; el cuadro en que el foco llega antes que la clase lo sigue cubriendo `:focus-within`.

De paso, para el vitest: el glifo `›` de `design/lab/section/estilo-banco.html` (mío) pasó a `→` (`src/icons/icons.test.js`, regla «Lucide es la única fuente de iconos»).

## Para lima (consolidado desde `estilo.md`)

1. **`is-ready` de `GSidebar` en la lista de clases entre componentes de #712:** la espera de A solo actúa con el sidebar montado; sin ella, la primera reserva al hidratar esperaría 240 ms con la página tapada. Propuesta en `app-shell.md` «Reserva»: «… y `is-ready` (montado: A solo espera con él)». Medido con el real: al cargar, la pista reserva 264 sin espera.
2. **B sin `translate`:** `app-shell.md` «Movimiento» y §B.1 dicen que la banda sale con `translate` de su alto. Con `translate` y la cifra animada a la vez la banda se mueve el doble que el zócalo y asoma la página entre ambos (medido en el banco de estilo: hasta 29 px en Chromium y 51 px en WebKit); sin él, la junta es ≤ 1 px en cada cuadro en los tres motores con el componente real. Pido cambiar el texto.
3. **El foco que entra en la banda cedida la devuelve al instante** (sin deslizarse; `:focus-within` en CSS): anotarlo en §B.2. Medido con el real: `.focus()` y Mayús+Tab desde el sidebar, Δ0.
4. **Reserva del navbar con el área segura** (`--g-sidebar-bar + env(safe-area-inset-bottom)`; bruno publica abajo el `padding-block-end` resuelto del marco, 68 sin muesca): anotarlo en «Reserva».
5. **S5 con `is-sticky`, no `is-stuck`:** enmienda de #715 en `page-header.md` y en el encargo de `app-shell.md` (Δ0 también antes de pegarse).
6. **`GAccordion sticky` no sufre S1** (medido otra vez con el chasis real, Δ0 en los tres motores, también con B): cerrar el punto «está por medir» de `api.md` «Piezas pegadas».
7. **S6 de bruno: `max(top final, valor actual)`.** El contrato dice que `GPageHeader` mide con el `top` **final** del canal; bruno mide con el mayor del final y el valor que la variable tiene a mitad de la transición (al volver de B, el zócalo aún está arriba). Medido: relevo sin costura y zócalo pegado correcto. Pido registrarlo en §B «canal interno».

## Para bruno

1. **Vitest rojo que no es de este lote:** `src/icons/icons.test.js` «la lista de la librería es la de `docs/contract/icons.md` §4» falla porque `icons.md` §4 incluye `play` (a0800ee, lima, contratos de marketing) y la lista generada de `scripts/` no. Es de bruno (regenerar la lista) o de lima (si `play` no debía entrar aún).
2. Andamio del banco `playground/app-shell.html`: la banda `.band` usa `--g-color-surface`, que en el tema por defecto es el mismo blanco que la página, así que la banda «Auditoría externa» no se distingue (se ve en `auditoria-A.png`). No es del chasis; un fondo `--g-color-surface-sunken` o una zona de marca haría visible el sangrado.

## Para mora-docs (`GAppShell/README.md`)

Uso sin receta; `GSidebar` hijo directo; `--g-app-shell-header` en `:root`; la voz con su `offset` (S4); cuándo elegir B (lectura larga) y que sin zócalo pegado no cede; límites: Opción+Tab en WebKit (S7), recorte horizontal del marco, navbar con zoom (S9), L4 del `h1` dentro de la columna.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Base, A y B con el componente real en los tres motores y 14 temas × zona: landmarks, salto, reserva por forma, cifra y receta, presupuesto del cuarto, S1 Δ0 (también con B y Mayús+Tab), `GAccordion sticky`, isla y avisos sin `offset.top`, `GContainer` dentro, RTL, contraste ≥ 4,5:1 / 3:1, `forced-colors` (Chromium), reducido, consola limpia.

**Correcciones.** Ninguna en `GAppShell.css`. Glifo del banco de estilo de `GSection` cambiado (vitest de iconos).

**Pendientes.** Las siete notas a lima; vitest de iconos (`play`, bruno o lima); `check-icons.mjs` marca también `design/lab/document-preview/r01/index.html` (ronda de kiwi, no tocado); no verificable aquí: lector de pantalla real, móvil y táctil reales, zoom real, `forced-colors` en Firefox y WebKit, restauración del desplazamiento e impresión. Durante la medición había cambios ajenos sin confirmar en `defaults.css` (`--g-hero-title-max`), `GDialog.css` y `GDatePicker.css` dentro del `dist/` construido; no afectan a lo medido aquí.
