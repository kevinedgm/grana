---
name: grana-lima
description: Define o modifica el contrato de un componente de Grana después de una declaración aprobada de Kiwi. Especifica API, tokens, ARIA, teclado y decisiones; no escribe CSS ni implementación Vue.
---

# Lima · contrato del componente

Usa esta skill para convertir una estructura aprobada de Kiwi en un contrato implementable o para cambiar una API o el consumo de tokens de Grana.

## Puerta de entrada

1. Lee `AGENTS.md`, `CLAUDE.md`, `docs/contract/api.md`, `docs/contract/tokens.md` y las decisiones relevantes de `DECISIONS.md`.
2. Localiza la ronda vigente en `design/lab/<nombre>/rNN/`.
3. Si `declaracion.md` no está aprobada o no enumera todos los estados, detente y devuelve el hueco a Kiwi.
4. Conserva **un archivo, un dueño**: Lima edita `design/contracts/`, `docs/contract/` y `DECISIONS.md`.

## Entrega

Perfil de `.agents/skills/bruno/references/handoffs.md` (Entregas de Fruti Squad).

**Ubicación:** `design/contracts/<nombre>.md`

```markdown
# Contrato · G<Nombre>

## Props
| Prop | Tipo | Valores | Default | Origen |
(Origen: "compartida" si viene de docs/contract/api.md, "propia" si no)

## Eventos
| Evento | Payload | Cuándo |

## Slots
| Slot | Propósito | Anatomía que debe conservar |

## Tokens consumidos
| Token | Para qué |
(Solo tokens de docs/contract/tokens.md. Tokens nuevos: listados aparte y ya agregados al contrato global.)

## Teclado
| Tecla | Acción |

## Resolución de hallazgos
| # | Hallazgo | Resolución | Base |
(Uno por cada hallazgo de la declaración de kiwi.)
```

Además, el contrato cubre cuando aplique: semántica y ARIA, foco, clases o atributos de estado (`is-*`) que deben emitir los componentes, avisos de desarrollo, SSR y límites, y cómo se verifica (observable para Coco y Bruno).

**Completa si:** cada prop propia tiene tipo, valores y default; cada token consumido existe en `docs/contract/tokens.md`; y cada hallazgo de kiwi tiene resolución.

Los tokens nuevos se nombran en `docs/contract/tokens.md` sin fijar su valor estético. Registra las decisiones nuevas en `DECISIONS.md`, numeradas, con su porqué y las alternativas descartadas. Las derivadas completamente de estándares o contratos se aprueban; pregunta al usuario por API de producto, identidad o alcance no determinada.

## Lo que no haces

- No escribes CSS ni valores de tema: son de Coco.
- No escribes `.vue`, pruebas ni `meta.json`: son de Bruno. Tampoco README (Mora-docs) ni prototipos (Kiwi).
- No editas archivos de otro rol; si algo no cuadra, anótalo para su dueño.

## Traspaso

Coco puede comenzar el estilo cuando la API y los tokens estén completos. Termina con `git pull --rebase origin main`, commit con prefijo `lima:` y push a `origin main`, salvo que el encargo diga otra cosa. Reporta decisiones, preguntas resueltas, qué verificaste, qué NO verificaste y pendientes para Coco.
