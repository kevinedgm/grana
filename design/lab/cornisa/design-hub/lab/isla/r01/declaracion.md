# Declaración de cumplimiento · Isla · r01

| Campo | Valor |
|---|---|
| Ruta | R1 |
| Fidelidad | F2 (con una desviación declarada: movimiento funcional) |
| Pregunta de diseño | ¿Puede una superficie superior no modal, compacta/expandible y actualizable, comunicar estado y acciones sin tapar ni bloquear la página y siendo accesible? |
| Artefactos | brief.md · index.html · decisiones.yaml · hallazgos.md · declaracion.md |
| Modifica producción | No (no existe código de producción) |

## Estándares leídos
- Kiwi: `wireframing.md`, `geometry-contract.md`, `hig-web-pwa.md` (se toma el criterio, no la apariencia de Apple), `validacion.md`, `fidelidad.md`.
- WCAG 2.2 AA: criterios aplicados y citados por número (2.1.1, 2.2.1, 2.4.3, 2.4.7, 2.4.11, 2.5.8, 3.2.1, 4.1.2, 4.1.3, 2.3.3 como orientación AAA para el movimiento). **No releí el texto oficial de WCAG en esta sesión**: los criterios se citan de memoria y conviene que coco los contraste con la fuente en el R0.
- Una guía HIG normativa del proyecto: **no está configurada en el perfil** → se registra como evidencia que falta y no se reconstruye de memoria (geometry-contract.md).

## Desviaciones del protocolo
- **Movimiento en F2.** El kit prohíbe el «movimiento F3». El usuario pidió validar interrupciones de animación, así que el prototipo incluye movimiento **funcional** (duraciones y curvas provisionales) para comprobar la mecánica: interrumpir, partir del tamaño actual, no apilar animaciones, alternativa reducida. Las curvas y duraciones definitivas son de coco (F3) y de `improve-animations`.
- **JS de comportamiento en el wireframe.** Hay una máquina de estados desechable dentro del HTML. No es código de producción y no se reutilizará.
- **Se añadió el ancho 320** a los tamaños de referencia (perfil: `[1440, 834, 393, 320]`).
- **Se añadieron proyectos Firefox y WebKit** a `playwright.config.js`.

## Comprobaciones ejecutadas
- `check_artifact.py --fidelidad F2`: ✔ 0 errores · 0 avisos.
- Playwright 1.x (`design-hub/qa`): **90/90 pruebas superadas**, es decir, 15 pruebas × 6 proyectos: Chromium 1440/834/393/320 (los de 393 y 320 con `isMobile` + `hasTouch`), Firefox 1440 y WebKit 393 (perfil iPhone 15). Antes de corregir hubo fallos reales (H-01, H-05) y otros que eran del propio test (coordenadas fuera del marco o del viewport); los del test se corrigieron en el test, no en el comportamiento.
  - No roba el foco y la página sigue operativa; no hay `inert` ni `aria-modal`.
  - Teclado: Enter expande, Tab llega a las acciones, Esc contrae y devuelve el foco al conmutador.
  - Descartar con el foco dentro devuelve el foco al disparador; el estado queda limpio.
  - `update` sin recrear (el mismo nodo DOM); `aria-valuenow`; ≤ 5 anuncios para unas 15 actualizaciones.
  - Interrupciones: expandir y contraer en 60 ms termina contraída sin animaciones en curso; actualizar durante el morph no salta más de 120 px entre frames; descartar durante la entrada deja `acts=0`, `order=0` y `timers=0`.
  - Varias actividades: prioridad alta primero; secundaria ≥ 44×44 con nombre accesible «y N más en espera»; promoverla mueve el foco a la primaria.
  - Movimiento reducido emulado (`emulateMedia`): todas las animaciones usan solo `opacity`.
  - Responsive: isla dentro del marco y targets ≥ 44 px en los estados long, multi y expanded, en los 6 proyectos.
  - Safe-area simulada: la isla queda por debajo del inset.
  - WCAG 2.2.1: el autodescartar se pausa con el foco dentro.
  - WCAG 2.4.11: al mover el foco a la página, el expandido se contrae y deja de solaparse con el elemento enfocado.
  - Clic fuera contrae sin descartar.
- Capturas de evidencia: `design-hub/qa/evidence/r01-*.png` (7 estados × 4 anchos) y hojas resumen `r01-hoja-*.png`.

## Matriz de adaptación
| Elemento | compact (<600) | medium | expanded (≥1024) | Motivo | Técnica | Foco/estado |
|---|---|---|---|---|---|---|
| Primaria compacta | Ancho del contenido, máx. 100% − 24 px; título con elipsis | Ídem, máx. 400 | Ídem, máx. 400 | Ocupar lo mínimo del borde superior | CSS intrínseco | Igual en todos |
| Primaria expandida | 100% − 24 px; puede tapar contenido → se contrae al salir el foco | 400 px | 400 px | Lectura y acciones | CSS + D-07 | Esc o foco fuera → compacto |
| Secundaria | **Solo icono** en <360 px (nombre accesible completo) | Icono + 9ch | Icono + 9ch | Espacio | Container query | Botón: promueve y enfoca |
| Acciones | Hacen wrap; «Cerrar» a la derecha | En línea | En línea | Targets de 44 px | flex-wrap | Orden: acciones → Cerrar |
| Safe-area | `top: env(safe-area-inset-top) + 8px` (simulado con 48 px de ejemplo) | — | — | Notch | env() | — |

## Comprobaciones NO ejecutadas
- **Lectores de pantalla reales** (VoiceOver, NVDA, JAWS, TalkBack): no se ejecutaron. Se verificaron los atributos ARIA y el contenido de las regiones vivas, **no** cómo se pronuncian.
- **Safari y Edge reales, y dispositivos iOS/Android físicos.** WebKit de Playwright no es Safari, y Edge se cubre solo como Chromium.
- **Zoom al 200 %, `forced-colors` y `prefers-contrast`**: no probados.
- **Rendimiento** del morph (FPS y layout en móviles modestos): no medido (H-09).
- **RTL e idiomas largos** distintos del caso alemán: no probados.
- **Gestos** (deslizar): no prototipados.
- **El contraste final** depende de la identidad visual (F3), así que no aplica en grises.

## Traspaso
- **→ lima (cuando el usuario apruebe):** pieza nueva `island` (patrón, `new`): no hay nada en el registry, que está vacío. Contrato propuesto en `docs/04-api-y-maquina-de-estados.md`; estados y decisiones en `decisiones.yaml`. Registrar como `draft`.
- **→ coco:** H-05 (regla `all:unset`), D-11 (morph solo en compositor), revisión normativa de los criterios WCAG citados, F3 cuando exista identidad visual.
- **→ mora:** nada todavía (no hay nada implementado ni verificado como producto).

## Siguiente paso del usuario
Aprobar o ajustar la estructura r01 y las decisiones D-01…D-07, resolver D-08…D-12, y aprobar el contrato de API, el suelo de navegadores y el nombre. **Kiwi no da la ronda por aprobada.**
