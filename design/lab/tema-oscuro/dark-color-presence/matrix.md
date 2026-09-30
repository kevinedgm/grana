# Matriz · Dark Color Presence · Fase 2 (11 temas × 6 roles = 66 muestras)

Superficie = `--g-color-surface` oscuro real del tema. A = lo que emite el Theme Engine; B = piso L ≥ 0.7 (simulación); C = ΔE OKLab ≥ 0.5 (simulación). `visual` = clasificación del asistente sobre las capturas (adequate, insufficient, excessive, pastel; `pending` si aún no se evalúa). Las cifras están en `results.json`.

## Validación de los 11 temas (`grana check`)

| Tema | ¿Pasa? | Errores | Avisos | Colisiones (semantic-close) | Superficie oscura | Neutros teñidos |
| --- | --- | --- | --- | --- | --- | --- |
| amazon | sí | 0 | 0 | — | #1A1C1F (L 0.226) | sí |
| apple | sí | 0 | 2 | info ↔ accent, info ↔ accent | #1C1C1C (L 0.226) | sí |
| caracol-purpura | sí | 0 | 2 | danger ↔ accent, danger ↔ accent | #201A1C (L 0.226) | sí |
| github | sí | 0 | 2 | info ↔ accent, info ↔ accent | #1C1C1C (L 0.226) | sí |
| grana | sí | 0 | 2 | danger ↔ brand, danger ↔ brand | #211A1A (L 0.226) | sí |
| linear | sí | 0 | 2 | info ↔ brand, info ↔ brand | #1B1C21 (L 0.228) | sí |
| lustre | sí | 0 | 2 | info ↔ accent, info ↔ accent | #1E1C17 (L 0.227) | sí |
| medium | sí | 0 | 2 | success ↔ accent, success ↔ accent | #1C1C1C (L 0.226) | sí |
| notion | sí | 0 | 2 | info ↔ accent, info ↔ accent | #1C1C1C (L 0.226) | sí |
| spotify | sí | 0 | 0 | — | #191D1A (L 0.225) | sí |
| stripe | sí | 0 | 2 | info ↔ brand, info ↔ brand | #1B1C21 (L 0.228) | sí |

## Muestras

| Tema | Rol | Claro | Oscuro A (HEX · L · C) | WCAG | ΔL | ΔE | visual A | B (HEX · L · ΔE) | visual B | C (HEX · L · ΔE) | visual C |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| amazon | brand | #232F3E L 0.301 C 0.032 h -106 | #91A0B2 · 0.7 · 0.031 | 6.4:1 | 0.474 | 0.475 | adequate | #91A0B2 · 0.7 · 0.475 | adequate | #99A8BA · 0.726 · 0.501 | adequate |
| amazon | accent | #FF9900 L 0.772 C 0.174 h 65 | #FF9900 · 0.772 · 0.174 | 7.98:1 | 0.546 | 0.575 | adequate | #FF9900 · 0.772 · 0.575 | adequate | #FF9900 · 0.772 · 0.575 | adequate |
| amazon | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.62:1 | 0.377 | 0.395 | adequate | #5EB47C · 0.701 · 0.49 | adequate | #62B880 · 0.714 · 0.502 | adequate |
| amazon | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.55:1 | 0.392 | 0.41 | insufficient | #CA924A · 0.7 · 0.489 | adequate | #CE964F · 0.713 · 0.501 | adequate |
| amazon | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.53:1 | 0.407 | 0.449 | adequate | #FC6852 · 0.699 · 0.51 | adequate | #FA664F · 0.693 · 0.505 | adequate |
| amazon | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.59:1 | 0.393 | 0.43 | adequate | #5B9EFF · 0.699 · 0.498 | adequate | #5DA0FF · 0.705 · 0.502 | adequate |
| apple | brand | #1D1D1F L 0.232 C 0.004 h -74 | #B3B3B6 · 0.768 · 0.004 | 8.15:1 | 0.541 | 0.541 | adequate | #B3B3B6 · 0.768 · 0.541 | adequate | #B3B3B6 · 0.768 · 0.541 | adequate |
| apple | accent | #007AFF L 0.603 C 0.218 h -103 | #2182FF · 0.623 · 0.205 | 4.63:1 | 0.396 | 0.446 | adequate | #5A9EFF · 0.699 · 0.499 | pastel | #5C9FFF · 0.702 · 0.501 | pastel |
| apple | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.61:1 | 0.376 | 0.394 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| apple | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.391 | 0.407 | insufficient | #CA924A · 0.7 · 0.487 | adequate | #CF9850 · 0.718 · 0.504 | adequate |
| apple | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.406 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| apple | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.392 | 0.432 | adequate | #5B9EFF · 0.699 · 0.499 | adequate | #5DA0FF · 0.705 · 0.503 | adequate |
| caracol-purpura | brand | #6F2148 L 0.382 C 0.117 h -7 | #BE698E · 0.628 · 0.116 | 4.57:1 | 0.402 | 0.416 | adequate | #D67FA4 · 0.7 · 0.486 | pastel | #DC84AA · 0.717 · 0.503 | pastel |
| caracol-purpura | accent | #B64A7A L 0.565 C 0.148 h -5 | #CE5F8F · 0.635 · 0.149 | 4.62:1 | 0.409 | 0.432 | adequate | #E473A3 · 0.699 · 0.493 | adequate | #E877A6 · 0.711 · 0.505 | adequate |
| caracol-purpura | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.63:1 | 0.377 | 0.398 | adequate | #5EB47C · 0.701 · 0.492 | adequate | #62B880 · 0.714 · 0.504 | adequate |
| caracol-purpura | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.57:1 | 0.392 | 0.407 | insufficient | #CA924A · 0.7 · 0.487 | adequate | #CF9850 · 0.718 · 0.504 | adequate |
| caracol-purpura | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.55:1 | 0.407 | 0.444 | adequate | #FC6852 · 0.699 · 0.506 | adequate | #FA664F · 0.693 · 0.5 | adequate |
| caracol-purpura | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.61:1 | 0.393 | 0.434 | adequate | #5B9EFF · 0.699 · 0.5 | adequate | #5DA0FF · 0.705 · 0.504 | adequate |
| github | brand | #24292F L 0.279 C 0.013 h -107 | #9FA6AD · 0.722 · 0.013 | 6.92:1 | 0.495 | 0.495 | adequate | #9FA6AD · 0.722 · 0.495 | adequate | #A3A9B1 · 0.732 · 0.506 | adequate |
| github | accent | #0969DA L 0.54 C 0.191 h -103 | #2D82F6 · 0.619 · 0.192 | 4.57:1 | 0.393 | 0.437 | adequate | #5B9EFF · 0.699 · 0.499 | adequate | #5DA0FF · 0.705 · 0.503 | adequate |
| github | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.61:1 | 0.376 | 0.394 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| github | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.391 | 0.407 | insufficient | #CA924A · 0.7 · 0.487 | adequate | #CF9850 · 0.718 · 0.504 | adequate |
| github | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.406 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| github | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.392 | 0.432 | adequate | #5B9EFF · 0.699 · 0.499 | adequate | #5DA0FF · 0.705 · 0.503 | adequate |
| grana | brand | #9D1635 L 0.452 C 0.167 h 16 | #DE5869 · 0.638 · 0.167 | 4.65:1 | 0.412 | 0.441 | adequate | #F46C7B · 0.7 · 0.499 | adequate | #F56D7C · 0.703 · 0.502 | adequate |
| grana | accent | #D85A70 L 0.633 C 0.159 h 12 | #D85A70 · 0.633 · 0.159 | 4.58:1 | 0.407 | 0.433 | adequate | #EF6F84 · 0.699 · 0.496 | adequate | #F17085 · 0.704 · 0.5 | adequate |
| grana | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.63:1 | 0.377 | 0.397 | adequate | #5EB47C · 0.701 · 0.491 | adequate | #62B880 · 0.714 · 0.503 | adequate |
| grana | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.56:1 | 0.392 | 0.406 | insufficient | #CA924A · 0.7 · 0.486 | adequate | #CF9850 · 0.718 · 0.503 | adequate |
| grana | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.54:1 | 0.407 | 0.442 | adequate | #FC6852 · 0.699 · 0.504 | adequate | #FC6751 · 0.698 · 0.503 | adequate |
| grana | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.6:1 | 0.393 | 0.435 | adequate | #5B9EFF · 0.699 · 0.501 | adequate | #5A9EFF · 0.699 · 0.501 | adequate |
| linear | brand | #5E6AD2 L 0.567 C 0.159 h -85 | #6F7DE6 · 0.628 · 0.157 | 4.66:1 | 0.401 | 0.427 | adequate | #8393FF · 0.699 · 0.494 | adequate | #8797FF · 0.709 · 0.502 | adequate |
| linear | accent | #8A7CFF L 0.662 C 0.188 h -75 | #8A7CFF · 0.662 · 0.188 | 5.19:1 | 0.434 | 0.469 | adequate | #958CFF · 0.699 · 0.496 | adequate | #988FFF · 0.707 · 0.502 | adequate |
| linear | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.6:1 | 0.375 | 0.395 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| linear | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.53:1 | 0.39 | 0.408 | insufficient | #CA924A · 0.7 · 0.488 | adequate | #CE964F · 0.713 · 0.5 | adequate |
| linear | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.51:1 | 0.405 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| linear | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.57:1 | 0.391 | 0.427 | adequate | #5B9EFF · 0.699 · 0.495 | adequate | #60A1FF · 0.708 · 0.502 | adequate |
| lustre | brand | #F5B940 L 0.821 C 0.148 h 81 | #F5B940 · 0.821 · 0.148 | 9.64:1 | 0.594 | 0.61 | adequate | #F5B940 · 0.821 · 0.61 | adequate | #F5B940 · 0.821 · 0.61 | adequate |
| lustre | accent | #5B3FE0 L 0.505 C 0.229 h -78 | #7D72FF · 0.635 · 0.202 | 4.64:1 | 0.408 | 0.46 | adequate | #918EFF · 0.699 · 0.503 | pastel | #918EFF · 0.699 · 0.503 | pastel |
| lustre | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.6:1 | 0.376 | 0.392 | adequate | #5EB47C · 0.701 · 0.488 | adequate | #64B981 · 0.717 · 0.503 | adequate |
| lustre | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.391 | 0.404 | insufficient | #CA924A · 0.7 · 0.484 | adequate | #CF9850 · 0.718 · 0.502 | adequate |
| lustre | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.406 | 0.444 | adequate | #FC6852 · 0.699 · 0.506 | adequate | #FA664F · 0.693 · 0.5 | adequate |
| lustre | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.392 | 0.436 | adequate | #5B9EFF · 0.699 · 0.502 | adequate | #5A9EFF · 0.699 · 0.501 | adequate |
| medium | brand | #242424 L 0.26 C 0 h 90 | #ABABAB · 0.741 · 0 | 7.42:1 | 0.515 | 0.515 | adequate | #ABABAB · 0.741 · 0.515 | adequate | #ABABAB · 0.741 · 0.515 | adequate |
| medium | accent | #1A8917 L 0.55 C 0.174 h 143 | #30992B · 0.601 · 0.175 | 4.64:1 | 0.375 | 0.413 | insufficient | #53B94D · 0.701 · 0.506 | adequate | #52B74C · 0.696 · 0.5 | adequate |
| medium | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.61:1 | 0.376 | 0.394 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| medium | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.391 | 0.407 | insufficient | #CA924A · 0.7 · 0.487 | adequate | #CF9850 · 0.718 · 0.504 | adequate |
| medium | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.406 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| medium | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.392 | 0.432 | adequate | #5B9EFF · 0.699 · 0.499 | adequate | #5DA0FF · 0.705 · 0.503 | adequate |
| notion | brand | #2F3437 L 0.321 C 0.009 h -126 | #93999C · 0.679 · 0.008 | 5.91:1 | 0.453 | 0.453 | adequate | #999FA3 · 0.699 · 0.473 | adequate | #A2A8AC · 0.728 · 0.502 | adequate |
| notion | accent | #2383E2 L 0.606 C 0.167 h -107 | #2786E5 · 0.615 · 0.167 | 4.57:1 | 0.389 | 0.423 | adequate | #4BA1FF · 0.7 · 0.5 | adequate | #4BA1FF · 0.7 · 0.5 | adequate |
| notion | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.61:1 | 0.376 | 0.394 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| notion | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.391 | 0.407 | insufficient | #CA924A · 0.7 · 0.487 | adequate | #CF9850 · 0.718 · 0.504 | adequate |
| notion | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.406 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| notion | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.392 | 0.432 | adequate | #5B9EFF · 0.699 · 0.499 | adequate | #5DA0FF · 0.705 · 0.503 | adequate |
| spotify | brand | #1ED760 L 0.77 C 0.212 h 149 | #1ED760 · 0.77 · 0.212 | 8.88:1 | 0.544 | 0.581 | excessive | #1ED760 · 0.77 · 0.581 | excessive | #1ED760 · 0.77 · 0.581 | excessive |
| spotify | accent | #A7F3C1 L 0.901 C 0.102 h 155 | #A7F3C1 · 0.901 · 0.102 | 13.18:1 | 0.676 | 0.682 | excessive | #A7F3C1 · 0.901 · 0.682 | excessive | #A7F3C1 · 0.901 · 0.682 | excessive |
| spotify | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.61:1 | 0.377 | 0.393 | adequate | #5EB47C · 0.701 · 0.488 | adequate | #62B880 · 0.714 · 0.5 | adequate |
| spotify | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.54:1 | 0.392 | 0.408 | insufficient | #CA924A · 0.7 · 0.488 | adequate | #CF9850 · 0.718 · 0.505 | adequate |
| spotify | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.52:1 | 0.407 | 0.449 | adequate | #FC6852 · 0.699 · 0.511 | adequate | #FA664F · 0.693 · 0.505 | adequate |
| spotify | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.58:1 | 0.393 | 0.434 | adequate | #5B9EFF · 0.699 · 0.501 | adequate | #5A9EFF · 0.699 · 0.5 | adequate |
| stripe | brand | #635BFF L 0.578 C 0.235 h -82 | #7173FF · 0.628 · 0.203 | 4.53:1 | 0.4 | 0.444 | adequate | #8991FF · 0.699 · 0.495 | pastel | #8C94FF · 0.707 · 0.501 | pastel |
| stripe | accent | #00AFC7 L 0.692 C 0.121 h -148 | #00AFC7 · 0.692 · 0.121 | 6.44:1 | 0.464 | 0.479 | adequate | #0CB2CA · 0.701 · 0.488 | adequate | #1CB7CF · 0.717 · 0.503 | adequate |
| stripe | success | #1E7A46 L 0.514 C 0.117 h 154 | #3F9560 · 0.603 · 0.116 | 4.6:1 | 0.375 | 0.395 | adequate | #5EB47C · 0.701 · 0.489 | adequate | #62B880 · 0.714 · 0.501 | adequate |
| stripe | warning | #8F5B00 L 0.516 C 0.111 h 71 | #AF792F · 0.618 · 0.111 | 4.53:1 | 0.39 | 0.408 | insufficient | #CA924A · 0.7 · 0.488 | adequate | #CE964F · 0.713 · 0.5 | adequate |
| stripe | danger | #C4321F L 0.542 C 0.186 h 31 | #E4523D · 0.633 · 0.185 | 4.51:1 | 0.405 | 0.447 | adequate | #FC6852 · 0.699 · 0.508 | adequate | #FA664F · 0.693 · 0.503 | adequate |
| stripe | info | #0B63CE L 0.518 C 0.182 h -102 | #3383F0 · 0.619 · 0.181 | 4.57:1 | 0.391 | 0.427 | adequate | #5B9EFF · 0.699 · 0.495 | adequate | #60A1FF · 0.708 · 0.502 | adequate |
