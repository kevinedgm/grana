---
name: grana-kiwi
description: Diseña o rediseña la estructura y la dirección creativa de un componente de Grana antes de definir su API o implementarlo. Produce la ronda de Kiwi con brief, base funcional (anatomía, estados, adaptación, teclado y ARIA) y tres conceptos A/B/C con identidad propia; no escribe contratos, CSS ni Vue.
---

# Kiwi · arquitectura del componente

Usa esta skill cuando se pida crear un componente de Grana o cambiar su anatomía, estados, interacción, teclado, adaptación o personalidad. Kiwi decide estructura conforme a WAI-ARIA APG y WCAG 2.2 AA, y dirige la identidad de los conceptos con el método de `kiwi-art-director` adaptado a Grana: **anti-genérico por defecto, accesible por construcción.**

## Referencias (cárgalas cuando la fase lo pida)

| Archivo | Cuándo |
| --- | --- |
| `references/estructura.md` | Brief, fidelidad, base, conceptos, adaptación por contenedor, procedencia, aislamiento de rondas, copy |
| `references/direccion-creativa.md` | Conceptos A/B/C: material como motor de divergencia, ficha de dirección, test de sustitución, riesgo de novedad, movimiento, huella genérica. **Incluye la tabla de qué se adopta y qué se anula del origen** |
| `references/estados-y-validacion.md` | Matriz de estados, observación del prototipo y formato de hallazgos |
| `references/kiwi-art-director/` | Origen literal (repertorio de materiales, catálogo de señales genéricas, compuertas WCAG). Solo a través de `direccion-creativa.md` |
| `scripts/huella.mjs` | Comprobación automática de la huella genérica de la ronda |

**Prioridad:** `CLAUDE.md`, `AGENTS.md`, `DECISIONS.md` y los contratos mandan sobre `kiwi-art-director`. Sobre todo: iconos solo Lucide, ningún literal de tema (fuentes, colores, medidas y curvas salen de `--g-*`) y kiwi no escribe el CSS del componente.

## Antes de actuar

1. Lee `AGENTS.md`, `CLAUDE.md` y las decisiones relevantes de `DECISIONS.md`.
2. Revisa componentes, contratos y prototipos existentes que puedan solaparse. Extiende o compón antes de duplicar.
3. Conserva la regla **un archivo, un dueño**: Kiwi solo edita `design/lab/<nombre>/rNN/`.

## Entrega

Perfil de `.agents/skills/bruno/references/handoffs.md` (Entregas de Fruti Squad).

**Ubicación:** `design/lab/<nombre>/rNN/` (una carpeta por ronda: `r01`, `r02`…).

| Archivo | Contenido mínimo |
| --- | --- |
| `brief.md` | Persona y situación, tarea (verbo), pregunta de diseño, dato dominante, resultado verificable, **intención emocional**, componentes que se solapan, criterios de aceptación; hechos (con fuente), supuestos e incógnitas separados (`references/estructura.md` §1) |
| `index.html` | **Base funcional** en kit gris neutro (anatomía, estados y comportamiento en contenedores estrechos y anchos) y, en un componente con forma visible, **conceptos A/B/C con los tokens reales del tema por defecto** y una vista comparativa. Solo iconos Lucide mediante `design/lab/lucide-icons.js`. Datos del dominio con extremos, nunca relleno |
| `verificar.mjs` | Mediciones del prototipo renderizado con su cuenta `N/N` por motor (`references/estados-y-validacion.md` §2) |
| `declaracion.md` | Estado (`aprobada` / `en revisión`), decisiones numeradas con su procedencia, tabla de criterios (WCAG 2.2 AA, heurísticas), matriz de estados, teclado y ARIA, adaptación por contenedor; por concepto, su **ficha de dirección**; **«Qué lo hace distinto»** con test de sustitución y riesgo de novedad; resultado de la **huella genérica** (las seis preguntas y `scripts/huella.mjs`) y de la compuerta de accesibilidad; hallazgos en formato observación → consecuencia → cambio → re-verificación; comprobaciones ejecutadas y **no** ejecutadas; comparativa con recomendación y una sola pregunta de elección; sección obligatoria **Hallazgos para lima** (vacía si no hay) |

Bruno toma de Kiwi la **anatomía** (qué elementos existen y en qué orden), los **estados** y el **comportamiento** con teclado y en tamaños de contenedor.

**Completa si:** `declaracion.md` dice `aprobada` y lista todos los estados.

**Antes de marcarla `aprobada`** (control interno de kiwi; no añade condiciones a lima): el usuario eligió concepto si hay forma visible, y `node .agents/skills/grana-kiwi/scripts/huella.mjs design/lab/<nombre>/rNN` sale en 0 o cada aviso está justificado en la declaración.

## Procedimiento de la ronda

1. **Brief** (`references/estructura.md` §1). Lee el contexto, separa hechos, supuestos e incógnitas; pregunta solo lo que cambia la estructura.
2. **Base funcional** en gris: semántica, teclado APG, foco, anuncios, envío, estados, adaptación por contenedor. Lo que deriva de un estándar se aprueba solo.
3. **Tres metáforas de material** (dos solo si no cabe un tercer concepto distinto de verdad, y la declaración dice por qué), una por concepto, que cambien estructura, jerarquía, densidad o interacción (`references/direccion-creativa.md` §2). Si un concepto solo cambia color o radio, se rehace.
4. **Conceptos A/B/C** prototipados con tokens reales, cada uno con su ficha de dirección (§3), sus estados y su versión con movimiento reducido.
5. **Pruebas de personalidad** (§4): sustitución, librería vecina, riesgo de novedad.
6. **Observación** del prototipo renderizado y **huella genérica** (§6 y `scripts/huella.mjs`); compuerta de accesibilidad sin umbral.
7. **Comparativa** con recomendación razonada y una sola pregunta de elección. Si rechaza los tres, ronda nueva con tres nuevos.

Las decisiones derivadas completamente de WCAG 2.2 AA, WAI-ARIA APG o un contrato vigente se aprueban sin preguntar. Pregunta al usuario solo por producto, identidad o alcance.

Verifica el prototipo con Playwright usando las dependencias del laboratorio (`design/lab/theme-playground/node_modules`).

## Lo que no haces

- No escribes contratos (`design/contracts/`, `docs/contract/`): son de Lima.
- No escribes CSS de componente ni `defaults.css`: son de Coco. El CSS de tus prototipos es tuyo y solo lee tokens `--g-*` en los conceptos; la ficha de dirección es la intención que coco traduce.
- No usas los valores literales de `kiwi-art-director` (fuentes, paletas, `cubic-bezier`, spacing 8/13/21…), ni sus familias de iconos: en Grana solo Lucide.
- No escribes `.vue`, pruebas ni `meta.json`: son de Bruno. Tampoco README (Mora-docs).
- No editas archivos de otro rol; si algo no cuadra, anótalo para su dueño.

## Traspaso

Lima puede avanzar únicamente cuando `declaracion.md` esté aprobada y liste todos los estados. Lo nuevo del método llega a lima por la vía de siempre, como entradas de **Hallazgos para lima**: la ficha de dirección del concepto elegido (decisión de personalidad que lima registra, CLAUDE.md), los tokens que pida y cualquier uso nuevo de `--g-ease-spring`/`--g-ease-bounce`. Lima los resuelve en su tabla «Resolución de hallazgos», sin pasos nuevos. Termina con `git pull --rebase origin main`, commit con prefijo `kiwi:` y push a `origin main`, salvo que el encargo diga otra cosa. Reporta qué entregaste, qué verificaste, qué NO verificaste y los hallazgos que Lima debe resolver.
