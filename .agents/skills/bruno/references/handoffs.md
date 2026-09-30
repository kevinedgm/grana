# Entregas de Fruti Squad (perfil `grana`)

Qué espera Bruno de cada miembro y cómo verifica que la entrega está completa. Si kiwi, lima o coco tienen su propio `SKILL.md`, deben adoptar este perfil al trabajar en Grana.

## kiwi → estructura

**Ubicación:** `design/lab/<nombre>/rNN/` (una carpeta por ronda: `r01`, `r02`…).

| Archivo | Contenido mínimo |
| --- | --- |
| `brief.md` | Usuario, tarea, contexto de uso, qué problema resuelve |
| `index.html` | Prototipo sin estilo de marca: anatomía, estados y comportamiento en contenedores estrechos y anchos |
| `declaracion.md` | Estado (`aprobada` / `en revisión`), tabla de criterios (WCAG 2.2 AA, heurísticas), lista de estados, comprobaciones ejecutadas y **no** ejecutadas, y sección obligatoria **Hallazgos para lima** (vacía si no hay) |

Bruno toma de kiwi: la **anatomía** (qué elementos existen y en qué orden), los **estados** y el **comportamiento** con teclado y en tamaños de contenedor.

**Completa si:** `declaracion.md` dice `aprobada` y lista todos los estados.

## lima → contrato

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

**Completa si:** cada prop propia tiene tipo, valores y default; cada token consumido existe en `docs/contract/tokens.md`; y cada hallazgo de kiwi tiene resolución.

## coco → estilo

**Ubicación:** `packages/vue/src/components/G<Nombre>/G<Nombre>.css`

Reglas que Bruno verifica (no corrige; si fallan, devuelve a coco):

- Solo `var(--g-*)` y alias locales `var(--_*)`.
- Sin literales de color, radio, sombra ni duración, y sin valores de respaldo. Única excepción: los mínimos de accesibilidad `24px` y `44px` (contrato de tokens §7).
- Sin `@layer` dentro del archivo (el registro lo mete en `grana.components`).
- Clases que coinciden con las que emite el componente (`g-<tag>--variant-*`, `is-loading`…).
- Estados cubiertos: hover (dentro de `@media (hover: hover)`), `:focus-visible`, active, disabled, loading, `prefers-reduced-motion`, `forced-colors`.

**Completa si:** el archivo existe y el grep de literales no devuelve nada.

## coco → auditoría (paso 5)

Aplicar un tema distinto al por defecto (por ejemplo, `brand: "#0B1F4D"`, `radius: 0`, `shape: "pill"`) y confirmar que nada del componente queda con valores del tema anterior. Resultado en `design/lab/<nombre>/auditoria.md`.

## mora-docs → documentación

`packages/vue/src/components/G<Nombre>/README.md`, escrito a partir de lo verificado. Bruno le entrega `G<Nombre>.meta.json` como fuente de la API.
