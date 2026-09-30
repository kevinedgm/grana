# Evaluación visual ciega (segunda persona)

La clasificación visual de las Fases 2 y 4 la hizo **una sola persona** (el asistente). Esta carpeta permite que **otra persona** clasifique sin saber qué estrategia (Current / B / C) ni qué superficie muestra cada imagen.

## Qué entregar a la persona evaluadora
**Solo** los `.png` y `rating-template.csv`. **No** `key.json` (es la clave: dice qué es cada imagen).

## Qué hacer
Cada imagen (`001.png` a `039.png`) muestra botones y badges de un tema sobre una superficie oscura. Para **cada rol** (`brand`, `accent`, `success`, `warning`, `danger`, `info`; cada badge lleva su nombre) escribe **una** clase en el CSV:

| Clase | Significa |
| --- | --- |
| `insufficient` | Pierde presencia: se ve apagado o sucio frente a la superficie |
| `adequate` | Presencia suficiente sin dominar |
| `excessive` | Demasiado luminoso, saturado o dominante |
| `pastel` | Está aclarado hasta perder el carácter del tono (lavanda, celeste, rosa claro) |

Criterio único: «¿el color se distingue claramente de la superficie y conserva el carácter del tono sin dominar?». Se puede evaluar solo un subconjunto de imágenes o de roles (las celdas vacías se ignoran).

## Medir el acuerdo
```bash
node scripts/score-blind.mjs ratings.csv    # desde design/lab/theme-playground
```
Devuelve el acuerdo global, por clase y por estrategia, y las discrepancias (clasificación actual → segunda persona). **Es una medición del acuerdo, no una regla.** Si el acuerdo es bajo, la clasificación visual no es fiable y hay que tratar sus conclusiones con más cautela.

## Reproducir la hoja
`node scripts/blind-sheet.mjs [--seed=N]` regenera las imágenes con otro orden (el orden es reproducible por semilla).
