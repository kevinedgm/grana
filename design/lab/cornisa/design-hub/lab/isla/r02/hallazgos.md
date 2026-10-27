# Hallazgos · Isla · r02

| Id | Sev. | Hallazgo | Decisión | Responsable | Estado |
|---|---|---|---|---|---|
| H2-01 | Alta | En los estados expandidos la silueta no crecía y el detalle quedaba FUERA de la gota: se medía con el contenedor en `display:none` (alto 0) | Medir en un contenedor de medición aparte | coco (regla para la librería) | Corregido; visto en capturas y cubierto por la prueba de legibilidad |
| H2-02 | Media | «Pico» en la punta inferior cuando la gota es estrecha (curvatura aplicada a un tramo de longitud 0) | La curvatura escala con la longitud del tramo recto | kiwi | Corregido; visto en el filmstrip |
| H2-03 | Media | Regresión de H-07 (r01): título largo truncado en el expandido | Reajuste del título solo con el expandido asentado (D2-04) | kiwi | Corregido; capturas |
| H2-04 | Baja | Tras contraer, la fase se etiquetaba como «descenso» | Fase `contracting` propia | lima (máquina de estados) | Corregido |
| H2-05 | Media | La gota cubre la franja superior central (D2-08) | Pendiente de decisión | producto | **Abierto** |
| H2-06 | Media | Varias actividades sin resolver en este modelo (D2-06) | Pendiente de decisión | producto + kiwi (r03) | **Abierto** |
| H2-07 | Baja | Animación por rAF en JS (no CSS/WAAPI). AUDIT.md §5 prefiere CSS para lo predeterminado; aquí está justificado porque es dinámico, interrumpible y con velocidad. Coste medido solo en headless | Medir en dispositivos reales en F3 | coco + improve-animations | **Abierto** |
