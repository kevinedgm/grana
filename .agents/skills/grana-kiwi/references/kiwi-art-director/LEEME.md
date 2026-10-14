# Referencias de origen: kiwi-art-director

Copia literal de `kiro/skills/kiwi-art-direction/` del repositorio `kevinedgm/kiwi-art-director` (commit `225ec98`, v1.0.0). Se guardan sin editar para poder volver a sincronizarlas con un `cp` y un `diff`.

**No se leen solas.** En Grana mandan las reglas del proyecto: lo que estas referencias dicen se aplica a través de `../direccion-creativa.md`, que lista qué se adopta, qué se traduce y qué se anula. Si una frase de aquí contradice a `CLAUDE.md`, `AGENTS.md`, `DECISIONS.md` o los contratos, gana Grana (el propio origen lo prevé: «si el proyecto declara su propio sistema de diseño, el sistema del proyecto prevalece en ese punto concreto»).

| Archivo | Uso en Grana |
| --- | --- |
| `structural-process.md` | Brief, fidelidad, aislamiento de rondas, copy funcional. Adaptado a componentes en `../estructura.md` |
| `states-and-validation.md` | Matriz de estados y procedimiento de observación. Adaptado en `../estados-y-validacion.md` |
| `iconography-and-differentiation.md` | Hipótesis de personalidad y prueba de riesgo de novedad. **Familias de iconos anuladas: en Grana solo Lucide** |
| `material-archetypes.md` | Repertorio para nombrar conceptos A/B/C. **Valores literales anulados: todo se traduce a tokens `--g-*`** |
| `slop-fingerprint.md` | Catálogo de señales genéricas. Lista filtrada para componentes en `../direccion-creativa.md` §6 |
| `accessibility-gates.md` | Seis compuertas WCAG 2.2 AA. Coinciden con los mínimos de Grana; donde Grana es más concreto (24px / 44px táctil, texto ≥ 12px), manda Grana |
| `SKILL-origen.md` | El procedimiento original de cinco fases, como referencia |

## Re-sincronizar

```bash
cp ../kiwi-art-director/kiro/skills/kiwi-art-direction/references/*.md .agents/skills/grana-kiwi/references/kiwi-art-director/
cp ../kiwi-art-director/kiro/skills/kiwi-art-direction/SKILL.md .agents/skills/grana-kiwi/references/kiwi-art-director/SKILL-origen.md
git diff --stat .agents/skills/grana-kiwi/references/kiwi-art-director/
```

Si el `diff` trae algo nuevo, se revisa `../direccion-creativa.md` antes de usarlo.
