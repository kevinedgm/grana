# Estado del proyecto

> **2026-10-26 · `cornisa` 0.2.0-alpha.0 → CANDIDATE** (registro del Design Hub; sin publicar; MIT). r03: acción rápida en compacto + atajo opcional. Núcleo 21/21 · navegador 189/189 · tsc 0 · impeccable: critique (degradada) + distill/adapt/polish (manual-playbook), snapshot cerrado. Pendiente: D3-03, lectores de pantalla, Safari/Edge/dispositivos reales, marca, Stable Gate, autorización para publicar.

> **2026-10-26 · Implementación `cornisa` 0.1.0-alpha.0 (sin publicar, private, UNLICENSED).** Código en `cornisa/`. Núcleo 20/20 · navegador 147/147 · tsc 0 errores · axe sin violaciones · CSP estricta sin violaciones · 5 mutaciones detectadas. Candidate Gate de lima: **NO PASA** (impeccable no ejecutado). Registro: `draft`. Coco/Lima/Mora: protocolos seguidos a mano, no invocados. Pendiente: licencia, AT reales, Safari/Edge/dispositivos reales, marca, autorización para publicar.

## Histórico: fase de prototipo

> **Actualización r02 «Top-Edge Droplet»:** nueva dirección de interacción en `design-hub/lab/isla/r02/` (r01 se conserva). QA total: 150/150 (r01 90 + r02 60), con pruebas de mutación. Vídeos y filmstrip en `design-hub/qa/evidence/r02-*`. **Pendiente de tu juicio:** el criterio de aprobación («se percibe como una superficie que emerge del borde»). Lecturas adicionales: `impeccable/reference/animate.md` e `improve-animations/AUDIT.md` (solo leídas, no invocadas).

**Fecha:** 2026-10-26 · **Código de producción:** ninguno · **Paquetes publicados:** ninguno · **Acciones externas:** ninguna

## Uso de Fruti Squad: qué hice exactamente
| Pieza | Leída | Metodología seguida a mano | **Invocada de verdad** | Detalle |
|---|---|---|---|---|
| Lima (skill) | ✅ SKILL.md, first-run.md, intake.md, project-profile.md, component-api.md, _TEMPLATE.md | ✅ intake, perfil, scaffold | ❌ **No** (el Squad no está instalado como skill en este entorno) | **Sí ejecuté su script real** `scripts/init-project.sh --intake intake.yaml`, que generó el perfil, el Hub, el registry y el harness de QA. Después completé a mano `color_law`/`type_law`/`component_layout` |
| Kiwi (agente) | ✅ AGENT.md + references + plantillas | ✅ fases 1–5 (brief, ruta/fidelidad, estándares, wireframe F2, validación y declaración) y traspaso por escrito | ❌ **No** | **Sí usé** su kit `wireframe-kit.css`, su base HTML y su verificador real `scripts/check_artifact.py` (0 errores) |
| Coco (agente) | ✅ AGENT.md (encabezado y paso 0) | ❌ No aplica todavía (F3/R3 necesitan aprobación e identidad visual) | ❌ | — |
| Mora (agente) | ✅ AGENT.md (encabezado) | ❌ No aplica (no hay nada implementado) | ❌ | — |
| impeccable / improve-animations | Solo los encabezados de SKILL.md | ❌ | ❌ | Previstas para F3 y para auditar el movimiento |

## Entregables de esta fase
| Archivo | Contenido |
|---|---|
| `mis-agentes/skills/lima/profiles/isla-nombre-pendiente.md` | Perfil (borrador, pendiente de confirmación) con las decisiones aprobadas, las restricciones y los puntos abiertos |
| `intake.yaml` | El intake que se pasó al script de Lima |
| `design-hub/lab/isla/r01/index.html` | Prototipo F2 interactivo en grises |
| `design-hub/lab/isla/r01/{brief.md, decisiones.yaml, hallazgos.md, declaracion.md}` | Documentos de la ronda de kiwi |
| `design-hub/qa/tests/*.spec.js` + `evidence/*.png` | QA en navegador (90/90) y capturas |
| `docs/02-compatibilidad.md` | Versiones mínimas según los datos de MDN y propuesta de suelo |
| `docs/03-nombre.md` | 10 o más candidatos evaluados; recomendación `cornisa` |
| `docs/04-api-y-maquina-de-estados.md` | Contrato v0, máquina de estados, accesibilidad, seguridad y evaluación de WC |

## Verificado frente a pendiente
- **Verificado (en este entorno):** comportamiento del **prototipo** en Chromium (4 anchos), Firefox y WebKit de Playwright; verificador estático de kiwi; datos de compatibilidad de BCD 8.1.7; disponibilidad de nombres en npm, PyPI y crates.
- **Pendiente:** lectores de pantalla reales; Safari, Edge y dispositivos reales; zoom al 200 %, forced-colors y RTL; rendimiento; búsqueda de marcas en registros oficiales; organización de GitHub (la API devolvió 403).
- **La librería no existe.** Nada de lo anterior certifica la librería, solo el prototipo y el contrato.

## Criterios de salida de esta fase (los tienes que aprobar tú)
1. Estructura r01 y decisiones D-01…D-07; resolución de D-08…D-12.
2. API v0 y máquina de estados.
3. Suelo de navegadores.
4. Nombre (y autorización, si la das, para comprobar marcas o reservar el nombre).
5. Confirmación del perfil de Lima.
6. Identidad visual: cuándo y cómo quieres definirla (sub-flujo `NEW` de Lima o una referencia tuya).
