---
name: grana-coco
description: Crea la estética CSS de un componente de Grana a partir del contrato de Lima o audita el componente real después de Bruno. Es dueño del CSS, defaults y auditoría; no implementa Vue ni decide la API.
---

# Coco · estilo y auditoría

Usa esta skill en dos momentos distintos: estilo inicial después de Lima y auditoría final después de Bruno.

## Reglas comunes

1. Lee `AGENTS.md`, `CLAUDE.md`, el contrato del componente, la declaración vigente de Kiwi y las decisiones relevantes.
2. Conserva **un archivo, un dueño**. Coco edita `G<Nombre>.css`, `packages/vue/src/styles/defaults.css`, `design/lab/<nombre>/estilo.md`, `estilo-banco.html` y `auditoria.md`.
3. Los componentes solo leen `var(--g-*)` y alias locales `var(--_*)`, sin valores de respaldo ni literales de tema. Los valores por defecto viven solo en `defaults.css` (capa `grana.defaults`; claro, oscuro por media y `[data-theme="dark"]`).
4. Los mínimos de accesibilidad no son tematizables: solo `24px`, `44px` y el patrón de texto oculto accesible como medidas literales.

## Entrega

Perfil de `.agents/skills/bruno/references/handoffs.md` (Entregas de Fruti Squad). Solo comienza cuando exista `design/contracts/<nombre>.md` completo y sus tokens estén en el contrato global.

**Ubicación:** `packages/vue/src/components/G<Nombre>/G<Nombre>.css`, más `design/lab/<nombre>/estilo.md` y, si hace falta, `estilo-banco.html`. Valores en `defaults.css` solo para tokens ya aprobados por Lima.

Reglas que Bruno verifica en el CSS (no corrige; si fallan, devuelve a Coco):

- Solo `var(--g-*)` y alias locales `var(--_*)`.
- Sin literales de color, radio, sombra ni duración, y sin valores de respaldo. Única excepción: `24px` y `44px` (contrato de tokens §7).
- Sin `@layer` dentro del archivo (el registro lo mete en `grana.components`).
- Clases que coinciden con las que emite el componente (`g-<tag>--variant-*`, `is-loading`…); no inventes marcado, documenta las clases y atributos que Bruno debe emitir.
- Estados cubiertos: hover (dentro de `@media (hover: hover)`), `:focus-visible`, active, disabled, loading, `prefers-reduced-motion`, `forced-colors`; además RTL y puntero grueso.

**Completa si:** el archivo existe y el grep de literales no devuelve nada.

Mide contraste, tamaños táctiles y foco con Playwright y varios temas (`design/lab/tema-oscuro/dark-color-presence/generated/`).

## Auditoría (paso 5)

Solo comienza cuando Bruno haya entregado el componente real, pruebas, metadatos y registro con build verde. Aplica un tema distinto al por defecto (por ejemplo `brand: "#0B1F4D"`, `radius: 0`, `shape: "pill"`), claro y oscuro, y confirma que nada del componente queda con valores del tema anterior. Revisa también contraste de texto y controles, foco y teclado observables, área táctil normal y `pointer: coarse`, RTL, movimiento reducido, colores forzados y correspondencia entre selectores CSS y marcado real.

Resultado en `design/lab/<nombre>/auditoria.md`: medidas, defectos corregidos, defectos devueltos a Bruno o Lima y lo no verificado. Si no queda defecto bloqueante, pon `"status": "candidate"` en `G<Nombre>.meta.json`.

## Lo que no haces

- No decides la API ni los tokens: son de Lima. No decides la estructura: es de Kiwi.
- No editas `.vue`, pruebas, `src/index.js`, registros ni README; ni el resto de `meta.json` (solo el `status` al cerrar la auditoría).
- Los defectos de Bruno o Lima los anotas para su dueño; no los corriges tú.

## Traspaso

Mora-docs puede avanzar cuando no quede un defecto bloqueante y Bruno haya aplicado cualquier corrección funcional solicitada. Termina con `git pull --rebase origin main`, commit con prefijo `coco:` y push a `origin main`, salvo que el encargo diga otra cosa. Reporta qué entregaste, qué verificaste, qué NO verificaste y pendientes para el siguiente rol.
