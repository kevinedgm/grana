# Brief · GBtn r02 · estados, carga y éxito

> kiwi, 2026-11-07. Ronda propia de **B4** («confirmación breve tras la carga»), reservada por #300 y por `design/lab/personalidad/r01/declaracion.md`. Método: modelo de microinteracciones de Saffer (disparador, reglas, retroalimentación, bucles y modos) sobre los siete estados del botón.

## Para qué

Una persona pulsa «Guardar cambios», espera y sigue trabajando. Tiene que saber tres cosas sin apartar la vista: que el botón la oyó, que algo está pasando y **cómo acabó**. Hoy `GBtn` responde bien a las dos primeras con puntero y calla la tercera: la carga termina, vuelve la etiqueta y nada distingue un éxito de un fallo ni de una carga que se canceló.

## Qué pide la ronda

1. Analizar reposo, hover, pulsado, foco, deshabilitado, carga y éxito, separando lo que existe de lo que falta, con medida del componente real.
2. Corregir la premisa de B4. El patrón común es «el botón se pone verde con un `check` un segundo y vuelve». Se cuestiona porque:
   - el verde sobre un `danger` «Eliminar» contradice lo que pasó, y son 35 pares de color por medir;
   - salta de marca a verde en un tema que no pidió verde;
   - crea un modo oculto: ¿qué hace un clic durante ese segundo?
   - no dice qué se hizo y no sirve para lo que se puede deshacer.
3. Proponer tres conceptos divergentes y dejar la elección al usuario, porque es API nueva e identidad (`AGENTS.md`, «Aprobación autónoma»).

## Restricciones

- **Honestidad (#643):** solo la aplicación afirma el éxito. `loading` que pasa a `false` no significa éxito.
- **Movimiento (#299):** nada supera 240 ms; `--g-ease-bounce` y `--g-ease-spring` tienen usos cerrados; movimiento reducido con el patrón único; sin keyframes salvo reacción única o giro.
- **Motor existente:** `utils/loadPhase.js` (200/400/5000 ms, #532), canal `role="status"` de `GBtn` (#14, #257), `RECEIPT_MS` (#643), nodo `g-tooltip`.
- **Peso (#506, #550):** el margen del principal está agotado y `GBtn` vive en él.
- **Frontera:** `GToast` sigue siendo decisión de la aplicación; #643 regla 4 pide el acuse **junto a la acción**.
- **No se toca** `GBtn.vue`, `GBtn.css`, `btn.md` ni `DECISIONS.md` hasta que el usuario elija.

## Entrega

| Archivo | Qué es |
| --- | --- |
| `index.html` | Prototipo con tokens reales: «Hoy» y A, B, C, operación de 100 ms, 1,2 s o 6 s, éxito o fallo. `?theme=dark`, `?dir=rtl`, `?motion=reduce` |
| `declaracion.md` | Análisis, conceptos, rúbrica de movimiento, comparativa y pregunta de elección |
| `banco-real.html`, `medir-actual.mjs`, `medir-actual.json` | Medida del `GBtn` real en tres motores |
| `verificar.mjs`, `verificar-resultados.json` | Verificación del prototipo en tres motores |
