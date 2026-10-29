# Brief · pieza 3 · el texto sigue la densidad (r01, kiwi)

**Encargo:** ronda de estructura de la pieza 3 de la configuración global (#969). La dirección ya la tomó el usuario y no se reabre: **#966**, en `compact` cada rol de texto baja un escalón y nunca queda por debajo de 12 px. Enmienda #15 («la densidad no cambia la tipografía»), y los roles compactos los deriva el CLI.

**Punto de partida (construido):** la pieza 2 (#974 a #985, `design/contracts/density.md`). `--g-density` es heredable (1 · 0,875 · 0,75) y `data-g-density` vale en cualquier elemento. La prop es la región (B). P2 cede al dedo. Los popovers y el diálogo heredan la región, y los avisos, la isla y la voz fijan `default`. La pieza 1 (#970) pone `max(16px, rol)` en el texto editable con puntero grueso. Lima dejó escrito que la pieza 3 reasigna los tokens de texto **en el elemento de la región** y nunca con selectores descendientes (`density.md` §8, `tokens.md` §58).

**Problema que resuelve:** hoy el compacto aprieta la caja un 25 % y deja el texto del paso normal: 14/20 en una caja de 27. Es «una copia apretada», no «un hermano menor» (inventario §2.4, `craft.md` de FF §Sizes).

**Preguntas que resuelve la ronda:**

1. Qué es «un escalón»: ¿el rol de abajo o un factor?
2. ¿El interlineado acompaña al tamaño?
3. ¿Cambia el texto en `comfortable`?
4. ¿Bajan los títulos? ¿Se mantiene la regla de 14 de §23.4?
5. Mecanismo: región más cercana, anidación, P2, pieza 1 y el tema sin capa.
6. Alcance: qué texto sigue la densidad.

**Entregables** (`design/lab/density-text/r01/`):

| Archivo | Qué es |
| --- | --- |
| `escala.mjs` | Escala candidata en tres temas. Lee los valores base del CLI real |
| `gen-proto.mjs` | Genera `proto/*.css`: las reglas de región propuestas, con el tema por defecto y con dos temas del CLI, y `escala.json` |
| `index.html` | La misma pantalla con componentes reales de `dist/` en `default`, `comfortable` y `compact`, A frente a B en compacto, anidación, prop y ritmo |
| `verificar.mjs` | Verificación en Chromium, puerto 4212 |
| `declaracion.md` | Decisiones, «Qué lo hace distinto», hallazgos y preguntas |

**Fuera del alcance:**

- El CSS de coco, el `.vue` y el CLI de bruno, y el contrato de lima.
- La densidad de las cajas de G5 y `GCalendar` (pieza 4).
- La prosa con ritmo entre bloques y la forma `pill` en campos (pieza 5).

**Componentes existentes que se solapan:** ninguno nuevo. La pieza reutiliza el atributo de la pieza 2 y el patrón de la zona de marca (`data-g-zone`, que redeclara tokens en el elemento). No hay componente ni token de componente nuevo. `GText` y `GSection` ya leen los roles y los siguen solos.
