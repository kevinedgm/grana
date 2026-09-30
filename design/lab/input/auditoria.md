# Auditoría de coco · GInput (paso 5)

**Componente:** `packages/vue/src/components/GInput/` (el real, `GInput.vue` + `GInput.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montó el componente real con 25 combinaciones (5 tamaños × 3 densidades, y los estados normal, con contador, inválido, deshabilitado, solo lectura, con carga, `soft`, `soft` inválido, contraseña, `color`, `rounded="pill"`). Se compararon los estilos calculados bajo el tema por defecto y bajo un tema distinto, escrito sin capa como lo haría un proyecto. El puntero y el teclado fueron reales (hover con el ratón, Tab y foco).

## Tema de prueba

Superficies ámbar (`surface`, `surface-sunken`), texto y bordes marrones (`text`, `text-muted`, `text-subtle`, `border-control`, `border-strong`), `danger-text` #8A0F00, foco violeta, fuente Georgia, radio `sm` 0, borde 2px, foco 3px con separación 4px, transición 300ms, peso 700, tamaños 15px/13px (y 18px de `body`), espacio base 5.

## Resultado: aprobado, con un ajuste hecho

| Prueba | Resultado |
| --- | --- |
| Propiedades que dependen del tema (color, fuente, tamaño, peso, borde, radio, relleno, `placeholder`) en 25 campos | Todas cambian. Las únicas coincidencias (`lg` y `xl` a 16px) eran un falso positivo: mi tema no cambiaba `--g-text-body-size`; al cambiarlo a 18px, ambos pasan a 18px |
| Radio | Con `--g-radius-sm: 0`, todos dan `0px`; `rounded="pill"` da `999px` |
| Alturas: 5 tamaños × 3 densidades, espacio base 5 y borde 2px | Exactas en las 15 combinaciones (md 45, xl 65…) |
| Contraste en reposo (tema de prueba) | Texto 15.69 · etiqueta 16.67 · ayuda 9.89 · error 9.77 · marca de obligatorio 9.77 · `placeholder` 7.59 (6.71 sobre `soft`) · botón mostrar 9.31 · texto de solo lectura 13.87. Todos ≥ 4.5:1 |
| Borde de la caja contra el fondo | 6.92:1 (borde inválido 9.77). Con el tema por defecto, 3.45:1 (mínimo 3:1) |
| `soft`: relleno contra el fondo | 1.2:1, como es de esperar; la línea inferior da 6.92:1 |
| Hover real con el ratón (`:hover` verdadero) | Campo normal: el borde pasa a `text-muted` (#5A3E00). Inválido, deshabilitado y solo lectura: **sin cambio** de borde. El deshabilitado muestra `cursor: not-allowed` |
| Foco con teclado: campo normal | Anillo de 3px, color del tema (violeta), separación 4px, en la **caja completa**; el `<input>` no lleva contorno |
| Foco con `color="danger"` | Anillo del color `danger-text`, no el del tema |
| Foco en un campo inválido | Anillo del tema; el borde conserva el color de error |
| Foco en el botón mostrar/ocultar | Anillo propio de 3px hacia dentro; la caja no lo duplica |
| `prefers-reduced-motion` (bloque del CSS aplicado sin condición) | Transición de la caja `0s`; el indicador de carga pasa de 0.8s a 2s por vuelta |
| `forced-colors` (bloque del CSS aplicado sin condición), **antes del ajuste** | El borde del campo inválido usaba `Mark` (amarillo, sin garantía de contraste) y el navegador quita `box-shadow`, así que se perdía el doble grosor |
| `forced-colors`, **después del ajuste** | Borde `ButtonText`; inválido con borde de 2px (frente a 1px); deshabilitado en `GrayText`; `soft` con borde completo en `ButtonText` |
| Área táctil (`pointer: coarse` emulado a 320px) | Cajas de 44px en todos los tamaños probados (`xs`, `md`, `lg`); botón mostrar de 44px de alto; sin desborde horizontal |
| Atributos según el contrato | `class` y `style` van a la raíz; `data-*`, `name` y demás, al `<input>` (verificado: `data-k` aparece en el `<input>`, no en la raíz) |
| Literales en `GInput.css` | Ningún color; medidas solo `24px` y `44px`; sin `var()` con respaldo, sin `@layer` ni `<style>` |
| Errores y avisos en la consola | Ninguno |

## Ajuste hecho durante la auditoría

`GInput.css`, bloque `forced-colors`: se quitó `border-color: Mark` en el estado inválido y se sustituyó por `border-width: calc(var(--g-border-width) * 2)`. El error queda distinguido por el borde más grueso, la marca ⚠ y el texto, sin depender de un color de sistema poco fiable.

## Hallazgos

Ninguno bloquea.

1. **Ancho del botón mostrar/ocultar.** Con el texto completo ("Mostrar contraseña") mide 129px y, en el ancho por defecto (240px), deja unos 77px al campo. Es consecuencia de la decisión de lima (texto visible sin icono). Si se traduce a un idioma con texto más largo, el campo puede quedar demasiado estrecho. Opciones si molesta: reducir el texto, o aceptar un icono por slot.
2. **Falso positivo descartado.** Al cambiar el tema, `lg` y `xl` parecían conservar 16px: mi tema no cambiaba `--g-text-body-size`. No es un defecto del componente.
3. **Tema oscuro:** no existe aún.

## No verificado

- **Emulación real de `prefers-reduced-motion` y `forced-colors`:** la herramienta no permite activar esas preferencias del sistema. Se aplicó el contenido de cada bloque sin su condición y se comprobó su efecto; no se probó que el navegador active el bloque con la preferencia real.
- **Lector de pantalla real** (VoiceOver, NVDA): si la región `aria-live` junto a `aria-describedby` duplica el anuncio del error al enfocar. Sigue abierto.
- **Zoom al 200% del navegador** y **dispositivo táctil real**.
- **Hover del botón mostrar/ocultar** y **contraste en hover del campo** (solo se comprobó el borde del campo).
- **Autocompletar y gestores de contraseñas.**
