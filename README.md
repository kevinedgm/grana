# Grana

> *The only bug you'll want in your UI.*

Librería de componentes Vue 3 con tema por tokens. Los componentes traen la **estructura**; tu tema les da el **color**.

El nombre viene de la **grana cochinilla**, el insecto oaxaqueño cuyo tinte coloreó medio mundo. Grana funciona igual: un armazón fijo y un color que pone cada proyecto.

**Estado:** pre-alfa. Contrato de tokens v0.1 congelado; aún no hay componentes publicados.

## Cómo se tematiza (objetivo de la v0.1)

```json
{
  "brand": "#F5B940",
  "accent": "#5B3FE0",
  "radius": 20,
  "shape": "pill",
  "space": 4,
  "font": "Instrument Sans",
  "fontDisplay": "Instrument Serif",
  "fontSize": 16,
  "typeScale": 1.4
}
```

Todas las claves son opcionales. Sin tema, Grana usa su estilo por defecto. Detalle completo en [docs/contract/tokens.md](docs/contract/tokens.md).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `packages/vue/` | `@grana/vue`: componentes, capas CSS y plugin de Vue |
| `packages/cli/` | `@grana/cli`: genera `tokens.css` desde el tema (pendiente) |
| `docs/contract/` | Contrato de tokens y API compartida de props |
| `design/` | Entregas de Fruti Squad: prototipos (kiwi) y contratos por componente (lima) |
| `.agents/skills/bruno/` | Agente que construye los componentes |
| `AGENTS.md` | Reparto de responsabilidades entre agentes |
| `DECISIONS.md` | Registro de decisiones y su porqué |

## Licencia

MIT
