# Estados y validación de la ronda

Adaptación de `kiwi-art-director/states-and-validation.md`. Se usa tres veces: al declarar estados, al prototiparlos y al verificar el prototipo renderizado.

## 1. Matriz de estados y extremos

Para cada fila que aplique, `declaracion.md` responde: **qué lo dispara, qué pasa si falla y cómo se vuelve.**

| Caso | Qué comprobar en el prototipo |
| --- | --- |
| Reposo, hover, foco, activo, deshabilitado, solo lectura | Cada uno distinguible sin color (forma, borde, texto) |
| Inválido y error propio | Mensaje por `aria-describedby`; integración con `GForm` y `GErrorSummary` |
| Vacío / sin elegir | No parece un error; explica qué falta |
| Carga | Huella igual al contenido final (motor de `GLoadRegion` si aplica) |
| Error recuperable | Causa y reintento sin perder lo capturado |
| Datos largos | Texto 2–3× lo normal y traducción 30 % más larga no rompen la caja |
| Datos faltantes | `null`, 0, sin imagen: no parecen un fallo |
| Muchos elementos | Paginación, virtualización o cesión declaradas |
| Acción repetida | Doble activación sin efecto doble |
| RTL | Propiedades lógicas; flechas según la dirección visual |
| Puntero grueso | Áreas de 44 px sin solaparse |
| Teclado | Orden lógico, foco visible, Esc cierra capas, el foco vuelve al disparador |
| Movimiento reducido | La tarea se completa sin desplazamientos ni escalas |
| `forced-colors` | Bordes y foco visibles con colores del sistema |

Los estados son parte del concepto: carga, vacío y error se dibujan en el material de cada concepto A/B/C, no en un gris genérico. El error nunca depende solo del color; el éxito se confirma con el estado resultante.

## 2. Observación del prototipo (antes de entregar)

1. Abre el prototipo renderizado (Playwright con `design/lab/theme-playground/node_modules`, puerto propio). El código fuente no basta.
2. Recorre anchos estrecho, medio y ancho, y `pointer: coarse`. Busca desbordamiento horizontal.
3. Fuerza cada estado de la matriz.
4. Recorre la tarea principal solo con teclado; en RTL también.
5. Repite con `prefers-reduced-motion: reduce`.
6. Mide el contraste de cada par texto/fondo efectivo (en superficies translúcidas, en el punto más desfavorable) y de los no textuales ≥ 3:1.
7. Consola sin errores.
8. Ejecuta la huella genérica (`direccion-creativa.md` §6) y `scripts/huella.mjs`.

Deja las mediciones en un `verificar.mjs` de la ronda con su cuenta de casos (`N/N` en los motores ejecutados), como en las rondas anteriores.

## 3. Formato de cada hallazgo

**observación → consecuencia para el usuario → cambio → re-verificación**

> «El contorno del concepto B (`border`) sobre `surface-sunken` mide 2,4:1 → con baja visión no se ve dónde termina el control → paso el contorno a `border-control` → re-medido: 4,1:1 en el tema por defecto y en oscuro.»

Etiqueta lo que no se pudo verificar y por qué («sin lector de pantalla real: semántica revisada en el árbol de accesibilidad de Chromium»). Nunca «impecable».
