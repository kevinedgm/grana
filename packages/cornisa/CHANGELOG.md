# Changelog

## Sin publicar (en curso)
- **Build para CDN** (`npm run build`, esbuild solo en desarrollo): `dist/cornisa.{esm,iife}{,.min}.js`, `dist/cornisa{,.min}.css` y `dist/sri.json`. Los campos `exports`, `main`, `module`, `unpkg` y `jsdelivr` apuntan a `dist/`; `src/` queda disponible en `cornisa/source`.
- **Ejemplos CDN** en `examples/cdn/` (script clásico con SRI, ESM, import map y casos de uso), con respaldo local mientras el paquete no esté publicado.
- **Ejemplos CDN abiertos como `file://`** (fallo reportado por el usuario): el CSS de respaldo conservaba `crossorigin` y Chrome lo bloqueaba (la isla quedaba sin estilos); 02 y 03 no arrancaban porque los módulos ES no cargan desde `file://`. Ahora el respaldo quita `integrity`/`crossorigin` y los ejemplos ESM pasan al script clásico. Cubierto por pruebas `file://` en Chromium, Firefox y WebKit.
- **Corrección de compatibilidad** (hallada al preparar el build): el código usaba `Element.replaceChildren` (Chrome 86, FF 78), `addEventListener({ signal })` (Chrome 90, FF 86, Safari 15) y CSS `inset` y `padding-block` (Chrome 87, Safari 14.1), todo por encima del suelo declarado. Se sustituyeron por alternativas compatibles; `appearance` lleva prefijos y `:focus-visible` tiene respaldo con `:focus`.

## 0.2.0-alpha.0 — sin publicar (2026-10-26)
- **Acción rápida en compacto:** la primera acción se muestra en la fila compacta (36 px visuales / 44 px de área); en expandido se oculta para no duplicarse.
- **Atajo opcional** `createIsland({ shortcut })`: desactivado por defecto, con modificador obligatorio (WCAG 2.1.4), conmuta el foco y añade `aria-keyshortcuts`. Nueva exportación `parseShortcut`.
- `Drop.t` (tiempo simulado) para medir la continuidad del movimiento.
- Estado en el registro del Design Hub: `candidate`.

## 0.1.0-alpha.0 — sin publicar (2026-10-26)
- Primera implementación según la API v0 aprobada y la dirección de movimiento «Top-Edge Droplet» (ronda r02).
- Núcleo sin DOM (`cornisa/core`): máquina de estados, gestor con cola y prioridad, temporizadores pausables, anunciador con frecuencia limitada y modelo físico de la gota.
- Renderer DOM: Popover API con alternativa `position: fixed`, regiones vivas persistentes, teclado, foco no modal, safe-area, `--cornisa-reserved`, `prefers-reduced-motion` y `forced-colors`.
- Tipos TypeScript (`types/`).
- Licencia MIT.
- Pasadas de impeccable (critique degradada en un solo contexto; distill, adapt y polish aplicando los playbooks a mano):
  - adapt: el expandido se limita al alto del viewport y el detalle se desplaza (antes, en móvil horizontal con texto al 200 %, «Cerrar» quedaba fuera de pantalla).
  - polish: iconos SVG dibujados en lugar de glifos Unicode; chevron de expansión; estados hover/active; «Cerrar» sin borde discontinuo; `::selection` tematizada.
  - distill: se eliminan los bordes CSS por intención y la regla `:has()` de los iconos.
- `island._internals` documentado como INESTABLE (fuera de semver).
