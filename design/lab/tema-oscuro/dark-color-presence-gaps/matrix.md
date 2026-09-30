# Matriz · Dark Color Presence · Fase 2 (11 temas × 6 roles = 66 muestras)

Superficie = `--g-color-surface` oscuro real del tema. A = lo que emite el Theme Engine; B = piso L ≥ 0.7 (simulación); C = ΔE OKLab ≥ 0.5 (simulación). `visual` = clasificación del asistente sobre las capturas (adequate, insufficient, excessive, pastel; `pending` si aún no se evalúa). Las cifras están en `results.json`.

## Validación de los 11 temas (`grana check`)

| Tema | ¿Pasa? | Errores | Avisos | Colisiones (semantic-close) | Superficie oscura | Neutros teñidos |
| --- | --- | --- | --- | --- | --- | --- |
| colision-ajustada | sí | 0 | 1 | success ↔ brand | #191D1B (L 0.226) | sí |
| gris-medio | sí | 0 | 2 | info ↔ accent, info ↔ accent | #1A1C1F (L 0.226) | sí |
| ocre-oliva | sí | 0 | 5 | warning ↔ brand, success ↔ brand, danger ↔ accent, warning ↔ accent, success ↔ brand | #1D1C18 (L 0.226) | sí |
| tinte-acento-rojo | sí | 0 | 4 | danger ↔ accent, success ↔ brand, danger ↔ accent, success ↔ brand | #1F1B1A (L 0.226) | sí |
| tinte-acento-violeta | sí | 0 | 2 | info ↔ accent, info ↔ accent | #1B1C21 (L 0.228) | sí |

## Muestras

| Tema | Rol | Claro | Oscuro A (HEX · L · C) | WCAG | ΔL | ΔE | visual A | B (HEX · L · ΔE) | visual B | C (HEX · L · ΔE) | visual C |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| colision-ajustada | brand | #0F7A55 L 0.514 C 0.107 h 163 | #37956F · 0.604 · 0.106 | 4.62:1 | 0.378 | 0.391 | adequate | #57B38B · 0.699 · 0.484 | adequate | #5EB991 · 0.718 · 0.502 | adequate |
| colision-ajustada | accent | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.407 | 0.449 | adequate | #FC6852 · 0.699 · 0.51 | adequate | #FA664F · 0.693 · 0.505 | adequate |
| colision-ajustada | success | #9A9939 L 0.665 C 0.118 h 109 | #9A9939 · 0.665 · 0.118 | 5.67:1 | 0.439 | 0.454 | adequate | #A5A445 · 0.7 · 0.488 | adequate | #A9A94A · 0.715 · 0.503 | adequate |
| colision-ajustada | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.392 | 0.408 | insufficient | #CA924A · 0.7 · 0.488 | adequate | #CF9850 · 0.718 · 0.505 | adequate |
| colision-ajustada | danger | #B9317C L 0.543 C 0.185 h -9 | #DC539A · 0.643 · 0.185 | 4.66:1 | 0.418 | 0.46 | adequate | #F065AC · 0.7 · 0.512 | adequate | #EC62A8 · 0.689 · 0.501 | adequate |
| colision-ajustada | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.393 | 0.433 | adequate | #5B9EFF · 0.699 · 0.5 | adequate | #5DA0FF · 0.705 · 0.504 | adequate |
| gris-medio | brand | #626975 L 0.519 C 0.021 h -99 | #7F8693 · 0.619 · 0.021 | 4.66:1 | 0.393 | 0.393 | insufficient | #979FAC · 0.7 · 0.475 | adequate | #A0A8B5 · 0.729 · 0.504 | adequate |
| gris-medio | accent | #0E7490 L 0.52 C 0.094 h -137 | #368FAC · 0.609 · 0.094 | 4.62:1 | 0.384 | 0.394 | insufficient | #55ABC9 · 0.7 · 0.482 | adequate | #5BB1CF · 0.718 · 0.501 | adequate |
| gris-medio | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.62:1 | 0.377 | 0.395 | adequate | #5EB47C · 0.701 · 0.49 | adequate | #62B880 · 0.714 · 0.502 | adequate |
| gris-medio | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.55:1 | 0.392 | 0.41 | insufficient | #CA924A · 0.7 · 0.489 | adequate | #CE964F · 0.713 · 0.501 | adequate |
| gris-medio | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.53:1 | 0.407 | 0.449 | adequate | #FC6852 · 0.699 · 0.51 | adequate | #FA664F · 0.693 · 0.505 | adequate |
| gris-medio | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.59:1 | 0.393 | 0.43 | adequate | #5B9EFF · 0.699 · 0.498 | adequate | #5DA0FF · 0.705 · 0.502 | adequate |
| ocre-oliva | brand | #7C6700 L 0.519 C 0.107 h 95 | #97822C · 0.61 · 0.107 | 4.5:1 | 0.384 | 0.396 | insufficient | #B39E4A · 0.701 · 0.485 | adequate | #B9A451 · 0.72 · 0.504 | adequate |
| ocre-oliva | accent | #B8740B L 0.617 C 0.132 h 69 | #BB7712 · 0.627 · 0.132 | 4.68:1 | 0.401 | 0.42 | adequate | #D38D34 · 0.699 · 0.489 | adequate | #D79138 · 0.712 · 0.501 | adequate |
| ocre-oliva | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.61:1 | 0.377 | 0.393 | adequate | #5EB47C · 0.701 · 0.488 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| ocre-oliva | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.55:1 | 0.392 | 0.405 | insufficient | #CA924A · 0.7 · 0.486 | adequate | #CF9850 · 0.718 · 0.503 | adequate |
| ocre-oliva | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.53:1 | 0.407 | 0.446 | adequate | #FC6852 · 0.699 · 0.507 | adequate | #FA664F · 0.693 · 0.502 | adequate |
| ocre-oliva | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.393 | 0.436 | adequate | #5B9EFF · 0.699 · 0.502 | adequate | #5A9EFF · 0.699 · 0.501 | adequate |
| tinte-acento-rojo | brand | #0F766E L 0.511 C 0.086 h -174 | #379188 · 0.601 · 0.086 | 4.53:1 | 0.374 | 0.385 | insufficient | #58B0A7 · 0.7 · 0.483 | adequate | #5FB7AD · 0.722 · 0.504 | adequate |
| tinte-acento-rojo | accent | #E5483A L 0.623 C 0.196 h 29 | #E94C3D · 0.634 · 0.196 | 4.53:1 | 0.408 | 0.45 | adequate | #FF6554 · 0.7 · 0.509 | adequate | #FD5F4E · 0.689 · 0.5 | adequate |
| tinte-acento-rojo | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.62:1 | 0.377 | 0.395 | adequate | #5EB47C · 0.701 · 0.49 | adequate | #62B880 · 0.714 · 0.502 | adequate |
| tinte-acento-rojo | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.55:1 | 0.392 | 0.406 | insufficient | #CA924A · 0.7 · 0.486 | adequate | #CF9850 · 0.718 · 0.503 | adequate |
| tinte-acento-rojo | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.53:1 | 0.406 | 0.444 | adequate | #FC6852 · 0.699 · 0.506 | adequate | #FA664F · 0.693 · 0.5 | adequate |
| tinte-acento-rojo | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.59:1 | 0.392 | 0.434 | adequate | #5B9EFF · 0.699 · 0.501 | adequate | #5A9EFF · 0.699 · 0.5 | adequate |
| tinte-acento-violeta | brand | #F5B940 L 0.821 C 0.148 h 81 | #F5B940 · 0.821 · 0.148 | 9.64:1 | 0.593 | 0.614 | adequate | #F5B940 · 0.821 · 0.614 | adequate | #F5B940 · 0.821 · 0.614 | adequate |
| tinte-acento-violeta | accent | #5B3FE0 L 0.505 C 0.229 h -78 | #7D72FF · 0.635 · 0.202 | 4.64:1 | 0.407 | 0.45 | adequate | #918EFF · 0.699 · 0.496 | pastel | #9492FF · 0.709 · 0.503 | pastel |
| tinte-acento-violeta | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.6:1 | 0.375 | 0.395 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| tinte-acento-violeta | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.53:1 | 0.39 | 0.408 | insufficient | #CA924A · 0.7 · 0.488 | adequate | #CE964F · 0.713 · 0.5 | adequate |
| tinte-acento-violeta | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.51:1 | 0.405 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| tinte-acento-violeta | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.57:1 | 0.391 | 0.427 | adequate | #5B9EFF · 0.699 · 0.495 | adequate | #60A1FF · 0.708 · 0.502 | adequate |
