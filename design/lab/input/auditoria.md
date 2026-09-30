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

---

# Ampliación: auditoría del slot `action` (botón de acción)

**Componente:** `GInput` con un `GBtn` real en el slot `action` (`GInput.vue` + `GInput.css` + `GBtn`), con `dist/` reconstruido.
**Método:** Chromium, playground. 30 combinaciones montadas con el componente real (5 tamaños × 3 densidades, variantes del botón `solid`, `soft`, `outline` y `ghost`, campo `outline` y `soft`, inválido, deshabilitado, con carga, píldora, solo icono, `color`). Se compararon bajo el tema por defecto y bajo un tema distinto (marca azul marino, superficies ámbar, radio 0 y luego píldora, borde 2px, foco 3px con separación 4px, espacio base 5, Georgia). Hover, Tab y Enter reales.

## Resultado: aprobado, con un ajuste hecho

| Prueba | Resultado |
| --- | --- |
| Acoplamiento en las 30 combinaciones, con el tema distinto | Ninguna deja de estar acoplada; misma altura de caja y botón; misma línea superior |
| Alturas exactas (tamaño × densidad, espacio base 5, borde 2px) | Las 15 combinaciones coinciden con la fórmula (md 45, xl 65…); el botón, igual |
| Esquinas con radio 0 | Interiores y exteriores a 0 en caja y botón |
| Esquinas en píldora | Exteriores a 999px en caja y botón; interiores rectas |
| El botón sigue el tema | Fondo del botón `solid`: de #1F1F1F a #0B1F4D; borde de la caja: de 1px a 2px |
| Contraste del texto del botón (tema de prueba) | `solid` 15.94 · `soft` 13.95 · `outline` 15.94 · `ghost` 15.94; botón `outline` sobre campo `soft`: 13.26. Todos ≥ 4.5:1 |
| Borde del botón `outline` contra el fondo | 15.94:1 (mínimo 3:1) |
| `disabled` | Se propaga por el slot: campo y botón deshabilitados |
| `loading` del botón | `aria-busy="true"` y `aria-disabled="true"`, sin `disabled` nativo; el campo sigue editable |
| Error | `aria-invalid` solo en el `<input>`; el mensaje no está dentro de la fila del botón |
| Umbral de apilado (contenedores de 340, 301, 300, 299 y 220px) | 340 y 301: acoplado. 300, 299 y 220: el botón con texto pasa debajo, a ancho completo. El botón solo icono **nunca** se apila |
| RTL (`dir="rtl"`) | Botón a la izquierda de la caja; esquinas interiores rectas y exteriores redondeadas espejadas (propiedades lógicas) |
| Hover real con el ratón | El botón cambia a su color de hover (`#1F1F1F` → `#333333`); la caja no reacciona |
| Foco con teclado (campo → botón) | Anillo del campo: 3px, color del tema, `z-index: 1`. Anillo del botón: visible, `z-index: 1`, por encima de la caja |
| `prefers-reduced-motion` y `forced-colors` (bloques del CSS de `GInput` y `GBtn` aplicados sin condición) | Transiciones a `0s` en caja y botón; bordes de caja y botón a `ButtonText` |
| Táctil (`pointer: coarse`, 375px, conjunto acoplado de 311px) | Botones de al menos 44×44px; sin desborde horizontal |
| Errores y avisos en la consola | Ninguno |

## Ajuste hecho durante la auditoría

**Defecto:** con `pointer: coarse`, `GBtn` amplía su área de toque a 44×44px con un pseudo-elemento. Un botón acoplado más estrecho de 44px (icono `md` de 36px, `xs` de 26px) invadía hasta 9px de la caja y **robaba los toques** del borde del campo (`elementFromPoint` a 3px y 6px del borde devolvía el botón).
**Corrección** (`GInput.css`): en táctil, `.g-input__action > *` recibe `min-inline-size: 44px`. Ahora el botón mide 44px reales de ancho y el pseudo-elemento ya no sobresale. Verificado: seis botones de 44×44px como mínimo, y ningún toque a 3, 6 ni 12px del borde llega al botón.

## Hallazgos

Ninguno bloquea.

1. **El botón `soft` junto a un campo `outline`.** Su relleno frente al fondo da 1.14:1 (el texto del botón, 13.95:1). Es el diseño de la variante `soft` de `GBtn`, ya auditado; el botón se identifica por su texto y su posición pegada al campo.
2. **Botón `icon` estrecho en escritorio.** En ratón, un botón icono `xs` mide 26px de ancho; cumple los 24px mínimos.

## No verificado

- **Emulación real de `prefers-reduced-motion` y `forced-colors`** (la herramienta no la permite): se aplicó el contenido de cada bloque sin su condición.
- **Lector de pantalla real:** cómo se anuncia el conjunto (etiqueta, botón, error, carga de la acción). Sigue abierto.
- **Zoom al 200%** del navegador y **dispositivo táctil real** (se usó la emulación de `pointer: coarse`).
- **Botones `ghost` y `link`** dentro del conjunto: contraste del texto medido; el aspecto acoplado de un botón sin fondo ni borde no se valoró visualmente.


## Corrección posterior: palabras largas sin espacios

Una etiqueta, ayuda o error sin puntos de corte (una URL, un identificador) desbordaba la caja. Se agregó `overflow-wrap: anywhere` a `g-input__label`, `__hint` y `__error`. Comprobado a 300px con una palabra de 90 caracteres, con y sin la regla: sin ella desbordaban 5 elementos; con ella, ninguno (WCAG 1.4.10).
