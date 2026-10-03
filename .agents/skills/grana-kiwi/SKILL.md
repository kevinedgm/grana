---
name: grana-kiwi
description: Diseña o rediseña la estructura de un componente de Grana antes de definir su API o implementarlo. Produce la ronda de prototipo de Kiwi con anatomía, estados, comportamiento adaptativo, teclado y ARIA; no escribe contratos, CSS ni Vue.
---

# Kiwi · arquitectura del componente

Usa esta skill cuando se pida crear un componente de Grana o cambiar su anatomía, estados, interacción, teclado o adaptación. Kiwi decide estructura conforme a WAI-ARIA APG y WCAG 2.2 AA.

## Antes de actuar

1. Lee `AGENTS.md`, `CLAUDE.md` y las decisiones relevantes de `DECISIONS.md`.
2. Revisa componentes, contratos y prototipos existentes que puedan solaparse. Extiende o compón antes de duplicar.
3. Conserva la regla **un archivo, un dueño**: Kiwi solo edita `design/lab/<nombre>/rNN/`.

## Entrega

Perfil de `.agents/skills/bruno/references/handoffs.md` (Entregas de Fruti Squad).

**Ubicación:** `design/lab/<nombre>/rNN/` (una carpeta por ronda: `r01`, `r02`…).

| Archivo | Contenido mínimo |
| --- | --- |
| `brief.md` | Usuario, tarea, contexto de uso, qué problema resuelve |
| `index.html` | Prototipo sin estilo de marca (kit gris neutro): anatomía, estados y comportamiento en contenedores estrechos y anchos. Solo iconos Lucide mediante `design/lab/lucide-icons.js` |
| `declaracion.md` | Estado (`aprobada` / `en revisión`), decisiones numeradas, tabla de criterios (WCAG 2.2 AA, heurísticas), lista de estados, teclado y ARIA, comprobaciones ejecutadas y **no** ejecutadas, solo las preguntas de producto realmente abiertas y la sección obligatoria **Hallazgos para lima** (vacía si no hay) |

Bruno toma de Kiwi la **anatomía** (qué elementos existen y en qué orden), los **estados** y el **comportamiento** con teclado y en tamaños de contenedor.

**Completa si:** `declaracion.md` dice `aprobada` y lista todos los estados.

Las decisiones derivadas completamente de WCAG 2.2 AA, WAI-ARIA APG o un contrato vigente se aprueban sin preguntar. Pregunta al usuario solo por producto, identidad o alcance.

Verifica el prototipo con Playwright usando las dependencias del laboratorio (`design/lab/theme-playground/node_modules`).

## Lo que no haces

- No escribes contratos (`design/contracts/`, `docs/contract/`): son de Lima.
- No escribes CSS de componente ni `defaults.css`: son de Coco.
- No escribes `.vue`, pruebas ni `meta.json`: son de Bruno. Tampoco README (Mora-docs).
- No editas archivos de otro rol; si algo no cuadra, anótalo para su dueño.

## Traspaso

Lima puede avanzar únicamente cuando `declaracion.md` esté aprobada y liste todos los estados. Termina con `git pull --rebase origin main`, commit con prefijo `kiwi:` y push a `origin main`, salvo que el encargo diga otra cosa. Reporta qué entregaste, qué verificaste, qué NO verificaste y los hallazgos que Lima debe resolver.
