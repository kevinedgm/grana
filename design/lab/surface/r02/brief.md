# Brief funcional · Zona de marca (GSurface) · r02

**Agente:** kiwi · **Ruta:** R1 · prototipo directo · **Fidelidad:** F3 con **componentes reales** (`packages/vue/dist`) y temas reales generados con `@grana/cli` (no kit gris: lo que se juzga es identidad y contraste).
**Origen:** integración real (página «Hallazgos de integración real», proyecto NisaNabani, `brand #24366B`, `accent #C1D324`). Hallazgos **4** (P1, zona de marca), **7** (P1, texto secundario sobre marca) y **15** (P2, acento sobre marca; entra en esta ronda por decisión del usuario). Contexto: **22** (`GBtn neutral soft` sobre marca parece deshabilitado) y **9** (`GPageHeader`, que diseña otra ronda en `design/lab/page-header/r01/` y será la primera consumidora).

## Enunciado

Un **desarrollador que usa Grana** necesita pintar una **zona con el color de la marca** (la banda de un encabezado de página, un panel destacado) y poner dentro **cualquier componente de Grana** —texto, ruta, botones, métricas, insignias, etiquetas, un campo de búsqueda, tarjetas— sin reasignar tokens a mano y sin que nada quede ilegible.

## El fallo de hoy (medido en `index.html`, fila «Hoy»)

El proyecto pinta la banda aparte y reasigna `text`, `text-muted` y `focus`. Todo lo que tiene **superficie propia** sigue leyendo `--g-color-surface` (blanco) con la tinta ya reasignada (blanca): **título de `GCard outlined` 1,00:1**, texto del campo 1,00:1, anillo de la tarjeta 1,00:1. Lo que se pinta con un `*-text` de la página sobre la marca tampoco llega: ruta y antetítulo 2,49:1, tendencia de `GMetric` 2,16:1, contorno de `GBtn outline` 2,17:1 (navy + lima, claro). En oscuro empeora (1,14:1).

**Causa estructural:** los componentes solo leen `var(--g-*)` y los derivados se resuelven donde se declaran (`tokens.md` §10, §15). Una zona solo funciona si **redeclara un juego completo y coherente**, como ya hace `[data-theme]`. Tres piezas de Grana resuelven hoy «superficie inversa» cada una a su manera (isla #325, tooltip #387, botones de `GToast`), sin mecanismo común.

## Pregunta de diseño

¿Qué juego de tokens y qué mecanismo necesita una zona de marca para que **todos** los componentes funcionen dentro, con contraste garantizado por el CLI en cualquier tema y esquema, y qué hacen las superficies propias (tarjetas, campos) cuando caen dentro?

## Verbo y resultado

- **Verbo:** destacar una región con la identidad de la marca.
- **Resultado verificable:** con el tema por defecto, el del proyecto y el del hallazgo 15, en claro y en oscuro, todo texto ≥ 4,5:1 y todo contorno de control y anillo de foco ≥ 3:1 dentro de la zona, con los componentes reales y sin CSS del consumidor.

## Alcance

- Sí: mecanismo de la zona, juego de tokens, reglas de derivación propuestas para el CLI, qué componentes deben funcionar dentro, acento garantizado (hallazgo 15), qué ofrece la zona a `GPageHeader`.
- No: el encabezado de página (ronda propia), CSS de coco, el `.vue`, el CLI, `tone="inverse"` (se anota: el mismo mecanismo lo resolvería).
