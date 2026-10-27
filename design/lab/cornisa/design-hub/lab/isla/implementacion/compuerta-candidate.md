# Evaluación de la Candidate Gate (lima) · cornisa · 2026-10-26

> Evaluación hecha **a mano** según `skills/lima/reference/quality-gates.md`. Lima no se ha ejecutado como skill. **Evaluar no es transicionar**: el registro sigue en `draft`.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Anatomía definida | ✅ | r01/r02 + docs/04 + `types/index.d.ts` |
| Variantes justificadas | ✅ | Solo `intent` y `priority`; sin variantes de estilo |
| Todos los estados aplicables | ✅ | 6 estados públicos + progreso, indeterminado, temporizador, error, cola, largo |
| Contrato responsive | ✅ | Ancho por contenido ≤ min(400, vw − 24), safe-area; verificado a 1440/834/393/320 |
| Base de accesibilidad (teclado, foco, contraste, targets, zoom, texto largo) | ⚠️ PARCIAL | Teclado/foco/targets/largo ✔; axe ✔ (incluye contraste); zoom solo `runtime-verified-approx` |
| Demo interactiva en el Hub | ⚠️ PARCIAL | `cornisa/examples/` (demo real), pero no está en el Hub |
| critique → distill → adapt → polish (impeccable) | ❌ NO EJECUTADO | impeccable no se ha invocado |

**Veredicto: NO PASA** (falta un criterio obligatorio y hay dos parciales).
**Guarda NEW:** `design_system: NEW` + identidad neutra → dimensión `design_system: BLOCKED` para la calidad visual final, por diseño.

Dimensiones (fruti test): technical PASS · structural PASS (r02 congelada) · visual NO EVALUADA (neutra) · accessibility PARTIAL · design_system BLOCKED (NEW) · documentation PARTIAL.


## Reevaluación tras las pasadas de impeccable (2026-10-26)
| Criterio | Antes | Ahora |
|---|---|---|
| critique → distill → adapt → polish | ❌ | ⚠️ Ejecutadas con salvedades: critique **degradada** (un solo contexto); distill, adapt y polish **manual-playbook** |
| Base de accesibilidad | ⚠️ | ⚠️ Mejorada (pantallas bajas + texto 200 % arreglado y probado), pero el zoom sigue siendo `runtime-verified-approx` y no hay pruebas con lectores de pantalla reales |
| Demo en el Hub | ⚠️ | ⚠️ Sin cambios (`cornisa/examples/`) |
| P1 abierto de la critique (acciones en compacto) | — | ⛔ Pendiente de kiwi r03 |

**Veredicto: PARCIAL.** Ningún criterio está en rojo, pero hay salvedades que solo el usuario puede aceptar o rechazar (`gateAccepted`). **La transición draft → candidate requiere tu aprobación explícita**, y Lima no la aplica sola.


## Evaluación final y transición (2026-10-26, tras r03)
| Criterio | Estado |
|---|---|
| Anatomía · variantes · estados · responsive | ✅ (r03 añade la acción rápida a la anatomía, con aprobación del usuario) |
| Base de accesibilidad | ⚠️ Aceptada con salvedades: zoom aproximado y sin lectores de pantalla reales (`gateAccepted` solo para candidate) |
| Demo interactiva | ⚠️ En `cornisa/examples/` (no en el Hub) — aceptado |
| critique → distill → adapt → polish | ✅ con salvedad: critique degradada (un solo contexto) y el resto manual-playbook; los 5 problemas prioritarios están resueltos y el snapshot cerrado |

**Veredicto:** PASA con salvedades aceptadas por el usuario → **evaluar → transicionar → persistir**:
- Transición `draft → candidate` (lifecycle), con la aprobación explícita del usuario el 2026-10-26.
- Registro: `status=candidate`, `qa.candidate=true`, versión `0.2.0-alpha.0` (minor en iteración de candidate).
- **Stable** necesitará: harden (lima), auditoría de coco, verificación a 1440/1024/768/390, zoom nativo, lectores de pantalla reales, contexto de producto realista y aprobación explícita.
