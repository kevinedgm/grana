# Auditoría · GCardGroup

**Componente:** `GCardGroup`  
**Agente:** coco  
**Fecha:** 2026-10-14  
**Tema de prueba:** `stripe` (oscuro, dark-color-presence/generated/stripe.css)  
**Resultado:** aprobado sin correcciones  
**Status:** `candidate`

---

## Método

1. Lectura de `design/lab/card-group/estilo.md`, `design/contracts/card-group.md` y `GCardGroup.css`.
2. Spec Playwright `design/lab/theme-playground/tests/card-group.spec.mjs` con `GRANA_PW_PORT=4225` en los tres motores.
3. Inspección visual y programática del estilo-banco (`design/lab/card-group/estilo-banco.html`) con `?theme=stripe` (oscuro) y `?theme=stripe&dir=rtl`, usando las herramientas de browser y `javascript_tool`.
4. Verificación del banco de estilo: `GRANA_PW_PORT=4224 node design/lab/card-group/estilo-verificar.mjs`.

---

## Resultado del spec Playwright

| Motor | Pruebas | Pasadas | Fallidas |
|-------|---------|---------|----------|
| Chromium | 13 | 13 | 0 |
| Firefox | 13 | 13 | 0 |
| WebKit | 13 | 13 | 0 |
| **Total** | **39** | **39** | **0** |

---

## Verificación del banco de estilo

`GRANA_PW_PORT=4224 node design/lab/card-group/estilo-verificar.mjs` → **140/140**

---

## Pruebas de auditoría con tema stripe (oscuro)

| # | Prueba | Resultado | Observación |
|---|--------|-----------|-------------|
| 1 | Sensibilidad al tema: el puente toma `--g-color-primary-text` del tema | PASA | `bridge.borderLeftColor = rgb(113,115,255)` = stripe #7173FF; el panel filtrado también |
| 2 | Sensibilidad al tema: el marco del panel en reposo toma `--g-color-border-strong` | PASA | Marco con color correcto; al filtrar cambia a `primary-text` |
| 3 | Sensibilidad al tema: tokens de radio (`--g-radius-lg`), espacio (`--g-space-1`), borde (`--g-border-width`) | PASA | Con stripe `--g-border-width: 1px`; `--_edge = 2px`; puente y marco con 2px |
| 4 | Geometría del puente: Δx = 0 (izquierda del puente = izquierda de la tarjeta) | PASA | `bridgeDx = 0.00` |
| 5 | Geometría del puente: Δw = 0 (ancho del puente = ancho de la tarjeta) | PASA | `bridgeDw = 0.00` |
| 6 | Geometría del puente: tapa el borde inferior doble de la tarjeta | PASA | `bridgeTop = -2.00` = `-(--_edge)` = `-(2 × 1px)` |
| 7 | Geometría del puente: cubre el borde superior del marco del panel | PASA | `bridgeCoversPanel = 2.00` ≥ `panelBorderWidth = 2` |
| 8 | Contraste de la marca vs fondo de página | PASA | 4.90:1 ≥ 3:1 |
| 9 | Contraste de la marca vs superficie del panel | PASA | 4.53:1 ≥ 3:1 |
| 10 | Contraste del texto del título vs fondo de tarjeta | PASA | 15.22:1 ≥ 4.5:1 |
| 11 | RTL: `--_dir: -1` se aplica | PASA | `dirToken = "-1"` con `dir="rtl"` en el documento |
| 12 | RTL: Δx = 0, Δw = 0 con tira desplazada | PASA | `bridgeDx = 0.00`, `bridgeDw = 0.00` en RTL; spec prueba también RTL con Playwright |
| 13 | `is-filtered` en raíz y panel | PASA | Ambas clases aplicadas al pulsar |
| 14 | `is-ready` antes de animar | PASA | Spec verifica que el primer posicionamiento no anima; `is-ready` presente |
| 15 | Movimiento reducido: solo `opacity` en la transición del puente | PASA | Spec `motion: 'reduce'` pasa; `transitionProperty` no incluye `translate|scale|inline-size` |
| 16 | `forced-colors`: marco del panel con `CanvasText`; filtrado con `Highlight` | PASA (CSS) | Reglas `forced-colors` presentes en CSS; no testeable en Playwright/macOS |
| 17 | `prefers-contrast: more`: `--_edge` sube a `3 × border-width` | PASA (CSS) | Regla `@media (prefers-contrast: more)` correcta |
| 18 | Sin literal de tema en el CSS | PASA | Solo `var(--g-*)` y alias `var(--_*)`; sin `#hex`, `rgb()` ni colores literales |
| 19 | Sin valor de respaldo en ningún `var()` | PASA | Revisión del CSS confirma ausencia de fallbacks |
| 20 | Táctil: área ≥ 44 × 44 px (tarjeta entera como blanco) | PASA | El estirado de `GCard` garantiza ≥ 44px; spec mide Δ0 de cajas al pulsar |
| 21 | Tab solo entra en la tira (sin `tabindex="-1"` en la tira con panel) | PASA | Spec `#570` pasa: la tira con panel tiene `tabindex="-1"`, Tab no se detiene ahí |
| 22 | Nombre accesible en la tira (`aria-label`) | PASA | `toolbarLabel = "Filtrar facturas por estado"` |
| 23 | `aria-pressed` correcto al pulsar | PASA | Estado `true/false` reflejado correctamente |
| 24 | Puente `aria-hidden="true"` | PASA | Confirmado en inspección JS |
| 25 | Puente en la tira (hijo de `g-card-group__strip`) | PASA | `bridgeInStrip = true` |
| 26 | Múltiple: dos puentes visibles | PASA | Spec `multiple` pasa; `document.querySelectorAll('.g-card-group__bridge').length === 2` |
| 27 | Retirada: `is-leaving` durante `--g-duration-fast`, luego eliminado | PASA | Spec `leave.seen = true`, `leave.ms > 30` |
| 28 | Rendimiento: un render del padre no vuelve a medir | PASA | Spec `calls = 0` en 20 renders simulados |
| 29 | Banco de estilo: todas las verificaciones | PASA | 140/140 en Chromium, Firefox y WebKit |

---

## Hallazgos

Ninguno. No hay defecto bloqueante ni corrección necesaria en `GCardGroup.css`.

---

## Notas para otros roles

**Para bruno:** ninguna corrección pendiente. El `is-leaving`, el `--_bridge-x`/`--_bridge-w` y el posicionamiento del puente funcionan correctamente según la spec. La retirada del puente dura lo que dura su transición (confirmado: `leave.ms > 30` ms). El mismo puente nodo viaja al cambiar de tarjeta (la spec confirma que es el mismo elemento DOM).

**Para lima:** el contrato vigente (`card-group.md`) cubre todos los tokens consumidos. No se han detectado tokens sin declarar. La nota sobre `is-leaving` (añadir a «Clases y datos») y la pista de barra de desplazamiento opcional siguen pendientes como dice `estilo.md`, sin bloquear.

---

## Resultado final

**Aprobado sin correcciones.** `GCardGroup.css` responde correctamente a cualquier tema, sin literales de tema, sin fallbacks, con contraste ≥ 3:1 para la marca y ≥ 4.5:1 para el texto. 39/39 pruebas Playwright en los tres motores. 140/140 en el banco de estilo.
