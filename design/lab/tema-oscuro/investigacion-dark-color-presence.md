# Investigación pendiente · Dark Color Presence

**Estado:** abierta, sin cambios de código. **Dueño de la pregunta:** lima (reglas) · **Pruebas:** bruno (CLI) y coco (estética). **Abierta:** ver DECISIONS.md #96.

## Pregunta

En el tema oscuro, ¿basta el mínimo WCAG de 4.5:1 para derivar el `accent` y los semánticos (`success`, `warning`, `danger`, `info`), o hace falta una regla adicional que garantice que un color **se vea** (presencia visual), además de que se lea?

## Principio acordado

**4.5:1 es una restricción mínima de accesibilidad, no el objetivo estético de la derivación.** Un color puede cumplir contraste y aun así tener poca presencia visual sobre una superficie oscura.

## Qué hace hoy la derivación (no se modifica)

- `accent` y cada semántico, en oscuro: la base se conserva si L ≥ 0.5 o se refleja (1 − L); después sube L **solo hasta** 4.5:1 sobre la superficie oscura (`deriveDarkColor`, tokens.md §15). Los semánticos que no chocan con la marca ni se emiten: valen los del tema por defecto oscuro.

## Evidencia que originó la duda (un solo caso, insuficiente para cambiar la regla global)

Comparación del caso **Lustre** (oro `#F5B940` + violeta `#5B3FE0`) entre la derivación del CLI y los valores escritos a mano por el diseñador, en oscuro:

| Token | Derivado | Lustre (a mano) |
| --- | --- | --- |
| accent / violeta | `#7D72FF` | `#B2A4FF` |
| success / éxito | `#3F9560` | `#4ED3A0` |
| warning / alerta | `#AF792F` | `#F2B55A` |
| danger / peligro | `#E4523D` | `#FF8A80` |

Todos los derivados cumplen 4.5:1; los de Lustre son más luminosos y, a simple vista, con más presencia.

## Por qué no se cambia la regla ahora

Un único ejemplo no justifica modificar una regla global que afecta a todas las marcas. Hay que comprobar si el efecto aparece con **distintas familias cromáticas** y si una regla nueva no degrada otras (colores ya vivos, amarillos, azules saturados).

## Plan de la investigación

1. **Muestra:** marcas y acentos de familias variadas (rojos, naranjas, amarillos, verdes, verdes azulados, azules, violetas, magentas y grises), con croma bajo, medio y alto.
2. **Medir por token derivado** (oscuro): L y C en OKLCH, contraste WCAG contra `surface` y `bg`, y **luminosidad perceptual** (por ejemplo L OKLCH y el contraste APCA como segunda opinión, sin sustituir a WCAG).
3. **Definir presencia:** una métrica candidata, por ejemplo distancia OKLab a `surface` (ΔE) o `L` mínima por familia de tono, y un umbral.
4. **Probar reglas candidatas** (solo en una rama de pruebas): (a) subir L hasta un piso perceptual además de 4.5:1; (b) un piso de croma; (c) una combinación L y C con tope por tono (para no deslumbrar a amarillos y verdes).
5. **Revisión visual** en el playground con el tema oscuro: botones sólidos, insignias `soft`, texto de color, íconos, foco y bordes; y en `tokens.json` comparar con los valores de referencia.
6. **Criterio de decisión:** la regla adicional se adopta solo si mejora la presencia en la mayoría de las familias **sin** romper contraste, ni empeorar otras familias, ni cambiar los resultados del claro. Si no, se deja 4.5:1 como suelo y se documenta la opción de `overrides` / `dark: { accent, overrides }`.

## Fuera de alcance

Tema claro, colores de gráficas de datos (§17.14) y cualquier cambio del mínimo de 4.5:1.

## Resultado

Pendiente.
