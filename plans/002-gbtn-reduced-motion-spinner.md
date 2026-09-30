# 002 — Mantener el indicador de carga visible con movimiento reducido

- **Status**: DONE
- **Commit**: 34d80bb
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 archivo (`GBtn.css`), ~4 líneas

## Problem

Con `prefers-reduced-motion: reduce` el anillo de carga deja de girar. Queda un círculo estático con un borde transparente y la etiqueta oculta: para una persona sin lector de pantalla no hay ninguna señal de que algo está en curso (el texto del estado solo llega a tecnologías de apoyo). Reducir el movimiento no significa cero movimiento: un giro lento y continuo es tolerable y comunica progreso.

```css
/* packages/vue/src/components/GBtn/GBtn.css:270 — current */
@media (prefers-reduced-motion: reduce) {
  .g-btn {
    transition: none;
  }
  .g-btn__loader {
    animation: none;
  }
}
```

## Target

En reduced motion el giro se mantiene, pero 2,5 veces más lento (800 ms × 2,5 = 2000 ms) y sigue siendo `linear` (movimiento constante). La duración sale del token existente, sin literales:

```css
/* target */
@media (prefers-reduced-motion: reduce) {
  .g-btn {
    transition: none;
  }
  .g-btn__loader {
    animation-duration: calc(var(--g-duration-spin) * 2.5);
  }
}
```

## Repo conventions to follow

- Regla de CLAUDE.md: solo `var(--g-*)` y alias `var(--_*)`; sin literales de tema. `2.5` es un factor, no una medida de tema; el resultado se deriva del token.
- Ejemplo de derivación con `calc()` sobre tokens: `GBtn.css:38-39` (`--_h: max(24px, calc(var(--g-space-1) * var(--_units) * var(--_density)))`).
- El giro base está en `GBtn.css:107` (`animation: g-btn-spin var(--g-duration-spin) linear infinite;`) y el keyframe en `GBtn.css:120`; no se tocan.

## Steps

1. En `packages/vue/src/components/GBtn/GBtn.css`, dentro de `@media (prefers-reduced-motion: reduce)`, reemplaza `animation: none;` de `.g-btn__loader` por `animation-duration: calc(var(--g-duration-spin) * 2.5);`.
2. No cambies nada más. Si el tema del usuario redefine `--g-duration-spin`, el modo reducido lo respeta porque se deriva de él.

## Boundaries

- No toques `GBtn.vue`, las pruebas, `defaults.css` ni el contrato: no hay tokens nuevos.
- No cambies la regla `.g-btn { transition: none; }`; solo el indicador de carga.
- No añadas otro efecto (pulso, opacidad) sin decisión de coco.
- Si el bloque no coincide con el extracto (drift desde 34d80bb), DETENTE e informa.

## Verification

- **Mecánica**: `npm test` (18 verdes), `npm run build` y las compuertas de CLAUDE.md. `grep -n "animation: none" packages/vue/src/components/GBtn/GBtn.css` no debe devolver el bloque del loader.
- **Feel check**: en `/playground/`, abrir DevTools > Rendering > emular `prefers-reduced-motion: reduce`, pulsar "Confirmar reserva":
  - El anillo gira despacio (una vuelta cada ~2 s) y de forma continua, sin tirones.
  - Sin la emulación, sigue girando a la velocidad normal (una vuelta cada 0,8 s).
  - Las transiciones de color al pasar el ratón siguen desactivadas en modo reducido.
- **Done when**: con movimiento reducido el indicador se ve girar lentamente, sin literales nuevos en el CSS y con las pruebas y compuertas en verde.
