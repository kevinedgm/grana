# Grana · contexto para Claude Code

Librería open source de componentes **Vue 3** con tema por tokens (tipo Vuetify, pero la estructura es de la librería y el color lo pone cada proyecto). Repo: https://github.com/kevinedgm/grana. Paquetes: `@grana/vue` (componentes) y `@grana/cli` (pendiente). Prefijo `g-` (`<g-btn>`, `GBtn`, `--g-*`).

## Lee esto antes de tocar código

1. `AGENTS.md`: reparto de responsabilidades. **Un archivo, un dueño.**
2. `DECISIONS.md`: todas las decisiones con su porqué. No las reabras sin motivo nuevo.
3. `docs/contract/tokens.md` y `docs/contract/api.md`: contratos vigentes.
4. `.agents/skills/bruno/SKILL.md` y sus `references/`: cómo se construye un componente.
5. Para el botón: `design/lab/btn/r01/` (kiwi), `design/contracts/btn.md` (lima), `design/lab/btn/estilo.md` (coco).

## Cómo se trabaja: Fruti Squad

| Agente | Decide | Dueño de |
| --- | --- | --- |
| kiwi | Estructura: anatomía, estados, comportamiento | `design/lab/<nombre>/rNN/` |
| lima | Contratos: API y tokens | `design/contracts/`, `docs/contract/` |
| coco | Estética: CSS del componente, tema por defecto; audita | `G<Nombre>.css`, `styles/defaults.css` |
| bruno | Funcionalidad, pruebas, empaquetado, CLI | `*.vue`, `*.test.js`, `*.meta.json`, `src/index.js`, `components.css`, `grana.css`, `scripts/` |
| mora-docs | Documentación de lo verificado | `README.md` del componente |

Flujo por componente: kiwi → lima → coco → bruno → coco (auditoría) → mora-docs. Si falta una entrega previa, detente e invoca al dueño. Las aprobaciones se dan solas si todo deriva de un estándar; decisiones de producto o identidad se preguntan al usuario.

## Reglas que no se rompen

- Los componentes solo leen `var(--g-*)` y alias locales `var(--_*)`. **Sin valores de respaldo** y sin literales de tema. Únicas medidas literales permitidas: `24px`, `44px` (área táctil) y el patrón de texto oculto accesible.
- Valores por defecto solo en `packages/vue/src/styles/defaults.css` (capa `grana.defaults`). El tema del usuario va sin capa y siempre gana.
- Mínimos de accesibilidad fuera del tema: área táctil ≥ 24px (≥ 44px táctil), texto ≥ 12px, contraste ≥ 4.5:1 (controles 3:1), foco siempre visible.
- El `.vue` no lleva `<style>`: el CSS es de coco, en su propio archivo.
- Sin `fetch` ni globals de la app en componentes.
- **Iconos: solo Lucide** (`docs/contract/icons.md`, DECISIONS #85 a #87): nada de caracteres `✓ ▲ ● › ⚠…`, ni pictogramas dibujados con CSS, ni trazos escritos a mano; en los componentes se usa el `GIcon` interno.

## Comandos

```bash
npm install
npm test                 # vitest (packages/vue)
npm run build            # vite build + scripts/build-fonts.mjs
python3 -m http.server 4173 -d packages/vue   # playground: http://localhost:4173/playground/
```

**Verificación antes de cada commit: lo que debe estar y lo que NO debe estar.**

```bash
grep -q "g-btn--variant-soft" packages/vue/dist/grana.css   # el estilo del componente está registrado
! grep -q "data:font" packages/vue/dist/grana.css           # la fuente no quedó incrustada
! grep -q "createApp" packages/vue/dist/grana.umd.js        # Vue no quedó empaquetado
```

## Estado al pasar a Claude Code

**Hecho y en GitHub:** contrato de tokens v0.1; tema por defecto neutro (Notion/Medium/Apple): `brand` #1F1F1F, `accent` #0B63CE, Instrument Sans en `dist/fonts/`; `GBtn`: prototipo (kiwi), contrato (lima) y `GBtn.css` verificado en Chromium (coco).

**Entregado pero quizá sin aplicar:** la parte de bruno de `GBtn` (`GBtn.vue`, `GBtn.test.js` con 17 pruebas, `GBtn.meta.json`, registro en `index.js` y `components.css`, `playground/index.html`). Si `packages/vue/src/components/GBtn/GBtn.vue` no existe, está en `~/Downloads/grana-gbtn-vue.zip`: `unzip -o ~/Downloads/grana-gbtn-vue.zip` en la raíz. **Estas pruebas nunca se han ejecutado**; es probable que alguna falle por detalles de la librería de pruebas.

## Siguientes pasos, en orden

1. Aplicar y verificar la entrega de bruno de `GBtn`: `npm test`, build, compuertas, playground.
2. Paso 5, auditoría de coco sobre el componente real, con un tema distinto al por defecto. Resultado en `design/lab/btn/auditoria.md`; luego `status: "candidate"` en `GBtn.meta.json`.
3. `README.md` de `GBtn` (mora-docs) desde `GBtn.meta.json`.
4. Siguiente componente, empezando por la ronda de kiwi.

**Pendientes que no bloquean:** investigación **Dark Color Presence** (¿basta 4.5:1 en oscuro para `accent` y semánticos? Evidencia reunida con 9 familias y tres hipótesis, decisión pendiente; `design/lab/tema-oscuro/investigacion-dark-color-presence.md`); clave `primary` propia; regla automática «sin saltar niveles»; pruebas manuales en Firefox, Safari y lector de pantalla; `@grana/cli` (Flujo A: derivación OKLCH, validación de mínimos, `shape` → `--g-radius-shape`); tema oscuro; tema opcional grana + añil (en `tokens.md` §9); `round()` para alturas fraccionarias; adaptar las skills de kiwi, lima y coco al formato de `.agents/skills/bruno/references/handoffs.md`; actualizar Node 20 (sin soporte desde abril de 2026) a 22 o 24 LTS; revisar `npm audit` sin `--force`.

## Lecciones ya aprendidas (no repetirlas)

- Vite en modo librería **incrusta en base64** todo recurso que el CSS referencie. Por eso la fuente se copia con `scripts/build-fonts.mjs`, fuera de Vite.
- `min-block-size` es un mínimo, no una altura: el padding vertical se calcula desde la altura objetivo.
- Avisos de desarrollo: `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, nunca `import.meta.env.DEV`.
- Declarar los eventos en `emits`; si no, el listener del consumidor llega al elemento nativo por `$attrs`.
- Componentes con `inheritAttrs: false` que pasan `$attrs` al `<input>`: el manejador propio (`@input`, `@change`) debe ir **primero** con `mergeProps({ onX }, attrs)`; si va después, una escucha del consumidor ve el `v-model` sin actualizar (con un `<input v-model>` nativo no pasa). Hay una prueba de orden en `GInput` y `GCheckbox`.
- La skill de bruno vive en `.agents/skills/bruno/`. Para que Claude Code la descubra como skill: `mkdir -p .claude/skills && ln -s ../../.agents/skills/bruno .claude/skills/bruno`.
