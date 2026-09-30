# Entrega de coco · GAvatarMotion.css

**Archivo:** `packages/vue/src/components/GAvatarMotion/GAvatarMotion.css`. No se tocó `defaults.css`: sin tokens nuevos.
**Contrato:** `design/contracts/avatar-motion.md` (DECISIONS.md #105 y #106).
**Estado:** listo para bruno (registro pendiente en `components.css`; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/avatar-motion/estilo-banco.html` (desde la raíz del repo), con «Tema de prueba», «Oscuro» y selector de coreografía.

## Carácter propio

| Detalle | Cómo |
| --- | --- |
| **Color de la familia** | Caparazón y trazos (patas, antenas) en `strong`; núcleo en la base; bandas y puntas en una mezcla de la base con su tono suave (`color-mix(in oklab, base 45%, soft)`); ojos en `on` (el color de mayor contraste con la base) y pupilas en `strong` |
| **Sin literales de color** | Todos los `fill`/`stroke` salen de clases de parte; el SVG no lleva colores |
| **Tamaño** | `space × 6 / 8 / 12 / 24` (24, 32, 48, 96px; con `space` 5: 30, 40, 60, 120) |
| **Coreografía** | La del prototipo del usuario, sin cambios de duración ni amplitud (excepción documentada: constantes literales solo aquí). `success` usa la curva `--g-ease-out` (la misma del prototipo) |
| **Pivotes** | `transform-box: fill-box`; antenas desde su base |
| **Idle** | `--_idle-iterations: 2`; `--idle-loop` lo pone en `infinite` |

## Estados cubiertos

| Estado | Cómo |
| --- | --- |
| hover, `:focus-visible`, active, disabled, loading | **No aplican:** no es interactivo (el foco es del control que lo contiene) |
| `prefers-reduced-motion` | Sin animaciones (verificado: ninguna en `thinking`); poses de `success` (ojos 0.35) y `error` |
| `forced-colors` | Silueta en `CanvasText`, ojos y bandas en `Canvas`: la figura se reconoce en negro sobre blanco |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales de color, `var()` con respaldo, `@layer` | Ninguno |
| Ojo sobre el cuerpo (7 colores) | **5.33 a 16.48:1** (defecto) · **4.81 a 16.19:1** (oscuro) · **7.56:1** con el tema de prueba (`brand` verde azulado) |
| Pupila sobre el ojo | ≥ 7.46:1 (defecto) · ≥ 6.10:1 (oscuro) |
| Silueta sobre el fondo de página | ≥ 7.46:1 (defecto) · ≥ 6.20:1 (oscuro) |
| Bandas sobre el núcleo | 2.3 a 4.8:1: detalle decorativo, sin exigencia de contraste |
| Tamaños | 24/32/48/96px; con `space` 5, 30/40/60/120 |
| Coreografías | `idle`: respiración y parpadeo × 2; `thinking`: 6 animaciones infinitas; `success`: 1; `still`: ninguna |

## Observación para el usuario

Con el **tema por defecto de Grana**, `brand` es casi negro (`#1F1F1F`): el avatar sale negro. El granate del prototipo (`#9D1635`) llega con el `brand` del proyecto (o con `color="danger"`, que en el tema por defecto es rojo). Es lo que pide la regla de tema: el color lo pone cada proyecto.

## Hallazgos para bruno

1. `data-motion` en la raíz: `idle`, `thinking`, `success`, `error` o `still` (reposo quieto, sin animaciones).
2. `animationend` se escucha en el `svg` para `success`/`error` (la animación vive en el `svg`, no en la raíz). Para `idle`, el fin del **parpadeo** (el más largo, 8.4s) marca el paso a `still`; no hace falta: con `animation-iteration-count: 2` ya queda quieto. `still` sirve para cuando bruno quiera cortar el reposo explícitamente.
3. Las formas llevan `stroke-width` y `stroke-linecap` como atributos de geometría (parte del dibujo, no del tema).
