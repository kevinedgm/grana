# Nombre del paquete: investigación (sin fijar)

> **Decisión 2026-10-26:** el usuario eligió `cornisa`, **sin reservar**. La búsqueda en registros oficiales (EUIPO/USPTO/OEPM) **no se ha hecho**: no se puede consultar desde este entorno. Recomiendo hacerla (o encargarla) antes de la primera publicación.

**Método (2026-10-26):** registro de npm (`GET registry.npmjs.org/<nombre>`: 404 = libre), búsqueda de paquetes similares en npm, búsqueda de repositorios en GitHub (API de búsqueda, por nombre, ordenados por estrellas), PyPI y crates.io (para detectar choques de identidad en otros ecosistemas) y búsqueda web de marcas o productos con el mismo nombre.
**Límites:** **no se consultaron bases de datos oficiales de marcas (USPTO, EUIPO, OEPM, WIPO).** Esto no es asesoramiento legal. La disponibilidad en npm puede cambiar en cualquier momento hasta que se publique.

**Restricción previa:** «Dynamic Island» es marca de Apple. El propio repositorio `jhaemin/dynamic-island` lo hace constar. Se descartan nombres que la contengan o la evoquen directamente (`island`, `dynamic-*`), y además `dynamic-island` y `react-dynamic-island` **están ocupados en npm** (verificado: HTTP 200).

## Candidatos evaluados
| Nombre | npm | Conflictos detectados | Riesgo | Veredicto |
|---|---|---|---|---|
| **cornisa** | **Libre** | GitHub: 2 repos triviales (0★). Web: una app de taxis rumana («Taxi Cornisa»), otro sector. PyPI y crates libres | Bajo | ✅ **Recomendado** |
| **repisa** | **Libre** | GitHub: 25 repos, todos con 0★. PyPI libre. Sin productos de software encontrados | Bajo | ✅ Alternativa |
| alero | Libre | **CyberArk Alero™** (producto SaaS de seguridad, mismo sector: software); Alero Technology (software ECM) | **Alto** | ❌ |
| visera | Libre | **Olympus VISERA** (marca registrada de equipos médicos de imagen). Otro sector, pero la marca es notoria | Medio | ⚠️ No recomendado |
| cresta | Libre | **Cresta** (empresa de IA con organización `cresta` en GitHub, repo con 116★) | Alto | ❌ |
| notchbar | Libre | `navtoj/NotchBar` (app de macOS, 128★); evoca «notch», ligado a Apple | Medio | ❌ |
| toldo | **Ocupado** | `toldo` en npm = «An elevated dialog component for React» (`raphaelsalaja/toldo`, 293★): **misma categoría** | Alto | ❌ |
| notchkit | Libre | `HarshilShah/NotchKit` (Swift, 1.790★) | Alto | ❌ |
| cornice | Libre en npm | Cornice = framework REST de Python conocido (PyPI y crates ocupados; `Cornices/cornice` 389★) | Medio | ❌ |
| ledge / lintel / brim / crest / overhang / pillbox / capsula | Ocupados | `overhang` es además un plugin jQuery de notificaciones: misma categoría | — | ❌ |

## Recomendación: `cornisa`
- **Metáfora exacta:** una cornisa es el saliente del borde superior de un edificio, igual que la superficie que sobresale del borde superior del viewport. No evoca a Apple.
- Es corto, se pronuncia igual en español, inglés e italiano y casa con el tono en español de Fruti Squad/Grana.
- Está libre en npm, PyPI y crates; no hay proyectos de software relevantes con ese nombre.
- **Riesgo residual:** sin búsqueda en registros oficiales de marcas; la app de taxis es de otro sector.
- **Alternativa:** `repisa` (repisa = ledge), con un perfil de riesgo parecido.

**Antes de fijarlo (necesita tu aprobación):** buscar en EUIPO/USPTO, comprobar el dominio y la organización de GitHub (`github.com/cornisa`; **mi comprobación devolvió 403 por límite de peticiones de la API, así que no está verificado**) y, opcionalmente, publicar un placeholder en npm. **No lo he hecho**: publicar un placeholder es una acción externa que requiere tu autorización.
