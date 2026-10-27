# Criterios de publicación de `cornisa`

Ninguna publicación (npm, CDN, etiqueta de GitHub) sin **autorización explícita del usuario**. Estado al 2026-10-26.

| # | Criterio | Estado | Evidencia o siguiente paso |
|---|---|---|---|
| 1 | Licencia elegida por el usuario | ✅ MIT | `LICENSE`. Titular: «cornisa contributors» (**cámbialo si quieres un nombre o una organización concretos**). Sigue con `private: true` |
| 2 | Pruebas del núcleo en verde | ✅ | `evidence/resultado-core.txt` (21/21) |
| 3 | Pruebas de navegador en verde (Chromium ×4 anchos, Firefox, WebKit ×2) | ✅ | `evidence/resultado-navegador.txt` (259/259) |
| 4 | Pruebas de mutación de las reglas críticas | ✅ | 7 mutaciones detectadas (legibilidad, foco de retorno, 2.4.11, foco en actualización, hitos de anuncio, acción duplicada, salto de movimiento) |
| 5 | Typecheck de JS y tipos públicos | ✅ | `evidence/resultado-tsc.txt` |
| 6 | axe-core sin violaciones (A/AA) | ✅ | prueba «axe» en los 7 proyectos |
| 7 | Lectores de pantalla reales: VoiceOver (macOS + iOS), NVDA + Firefox/Chrome, TalkBack | ❌ **No ejecutado** | Probar con un guion: aparece, progreso, error, expandir, +N, descartar |
| 8 | Safari real (macOS + iOS) y Edge real | ❌ **No ejecutado** | WebKit y Chromium de Playwright no los sustituyen |
| 9 | Dispositivos físicos: fluidez del movimiento (60/120 Hz, Android de gama media) | ❌ **No ejecutado** | Solo hay coste JS medido en el prototipo, sin FPS en dispositivo |
| 10 | forced-colors y zoom nativo al 200 % | ❌ **No ejecutado** | El zoom solo se aproximó con font-size; forced-colors tiene CSS sin verificar |
| 11 | Suelo de navegadores (Chr 84 / FF 69 / Saf 14) | ⚠️ Corregido por análisis estático (APIs, sintaxis y CSS contra MDN) para `dist/`; **no probado** en esas versiones | Había 4 incumplimientos reales (ya corregidos). Probar en navegadores antiguos o declarar «probado: estables actuales» |
| 12 | Búsqueda del nombre en registros oficiales de marcas | ❌ Pendiente | EUIPO/USPTO/OEPM |
| 13 | Compuertas de Lima: Candidate (impeccable critique/distill/adapt/polish) y Stable (harden + auditoría de coco) | ✅ Candidate (con salvedades aceptadas); ❌ Stable no evaluada | Ver `design-hub/lab/isla/implementacion/compuerta-candidate.md` |
| 14 | Identidad visual | Neutra por decisión | La guarda NEW de Lima impide aprobar la calidad visual final |
| 15 | Minificado/ESM para CDN, `npm pack --dry-run` revisado | ✅ `dist/` + ejemplos CDN probados con un CDN simulado (rutas, CORS y SRI, incluido el rechazo de un archivo alterado) | Revisar el SRI en cada release; `prepack` ejecuta el build |
| 16 | CHANGELOG y versión semver | ✅ Borrador | `CHANGELOG.md` (0.2.0-alpha.0) |
| 17 | D3-03: ¿actividades con acciones persistentes por defecto? | ❓ Decisión del usuario | Cambia un valor por defecto de la API |

**Recomendación:** antes de una publicación `alpha` pública como mínimo hacen falta 1, 7 (VoiceOver + NVDA), 8 y 12, y la autorización explícita.
