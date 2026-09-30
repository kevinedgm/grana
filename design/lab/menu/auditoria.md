# Auditoría de coco · GMenu (paso 5)

**Componente:** `GMenu` real (`.vue` + `GMenu.css`), playground (`localhost:4173`), Chromium.
**Método:** tema propio sobre el playground (superficie crema, texto marrón, borde 2px, radios 2px, `space` 5px, Georgia, foco verde azulado de 3px, `text-subtle` y `danger-text` propios). Teclado real (Enter, flechas) para el foco; eventos sintéticos para Fin y Esc.

## Resultado: aprobado

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Cambian superficie, borde (2px), radio (2px), fuente (Georgia) y alto del elemento (45px = `space × 9`); todo sale de tokens |
| Contraste (tema propio) | Texto 13.9:1 · peligroso 7.16 · atajo y título de grupo 7.48 (los tres ≥ 4.5) |
| Foco (teclado real) | `:focus-visible` con contorno sólido de 3px en `--g-color-focus`; fondo `surface-sunken` |
| Áreas de acción | Elemento ≥ 45px de alto con el tema propio (mínimo 24px, 44px táctil) |
| Iconos | Marca de casilla (check), opción (circle relleno), submenú (chevron-right) y aviso: Lucide vía `GIcon` |
| Teclado | Enter abre y enfoca el primero; ↓ avanza saltando deshabilitados; Fin va al último; Esc cierra y devuelve el foco al disparador |

## Nota de método
Al primer intento el playground estaba en oscuro por el sistema y mis colores de texto eran del tema oscuro sobre una superficie clara (contrastes 2.5 a 3.4). No era un defecto del componente: al definir también `text-subtle` y `danger-text` del tema, los contrastes pasan.

## Sin verificar (no bloquea `candidate`)
Lector de pantalla real; `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` reales (solo presencia en la hoja); Firefox y Safari (`popover`, posicionamiento); táctil real; RTL con datos reales; submenús de tercer nivel con tema propio.
