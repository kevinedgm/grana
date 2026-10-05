# Declaración de Kiwi · layout adaptativo automático · r01

Estado: **aprobada** para traspaso a Lima. Fuente de autorización: usuario, 2026-10-04, pidió completar todas las fases autónomamente para Grana 1.0; el orquestador comunicó esa instrucción en esta ronda. Se aprueban las decisiones rutinarias dentro de layout automático acordado. El nombre público y la API no quedan congelados por este prototipo: Lima los especifica.

## Decisiones

1. Un contenedor invisible contiene hijos en orden de lectura. No exige filas/columnas declaradas. Los perfiles min/preferido/max/peso son información interna; el consumidor no los escribe en el caso común.
2. Cada componente podrá publicar su perfil. Prototipo: rango numérico acotado y restricción explícita a enteros determinan número máximo de caracteres; formato y capacidad se admiten como pistas en el motor; texto libre usa respaldo de 40 caracteres. Ninguna pista se presenta como conocimiento del uso real.
3. La etiqueta aporta ancho de la palabra más larga, medido con su fuente, no longitud arbitraria ni ancho de etiqueta completa. Si el contenedor es menor, el texto puede partirse para evitar desborde sin recortarse.
4. Partición contigua mediante programación dinámica: minimizar número de filas + 24 × suma de pérdidas relativas cuadráticas respecto al preferido. El 24 y el perfil de respaldo son parámetros experimentales de producto. No regla universal matemática de buen diseño.
5. Dentro de fila: reducir preferidos hasta mínimos cuando haga falta; distribuir sobrante por pesos con saturación en máximos. El sobrante puede quedar libre si todos tienen máximo; no se agranda campo corto solo para llenar. Si un único elemento excede contenedor cede su mínimo; nunca fuerza desborde horizontal.
6. El orden no cambia para rellenar huecos. No dense, order ni Masonry. Pesos son preferencias, no promesa de porcentaje exacto cuando intervienen límites o saltos.
7. Agrupación opcional conserva juntos dos elementos como unidad; dentro se permite adaptación y salto propio. No confundir grupo visual con fieldset de una pregunta compuesta; implementación deberá usar semántica adecuada.
8. Horizontal izquierda/centro/derecha y vertical arriba/centro/abajo se expresan físicamente; RTL invierte dirección de lectura pero no el significado físico de la alineación. Sin altura sobrante, centrar verticalmente no crea espacio.
9. El prototipo mide contenedor, agrupa escrituras en rAF y espera fuentes. No escucha input para redimensionar a cada carácter. Valor, edición y selección permanecen en el mismo nodo; el render experimental mueve nodos a wrappers de filas y restaura foco. Producción deberá evitar relocalización innecesaria y preservar identidad Vue.
10. Reveal oculta y deshabilita control; no desmonta. El plan ignora hidden, no disabled/readonly visible. La integración con GFormReveal debe respetar #276.
11. Sin medición o JS: contenido en pila legible. Sin animación en ronda estructural. CSS neutro solo del laboratorio; no se declara cumplimiento de contrato tokens de producción.

## Qué lo hace distinto

Distribución por necesidades de componentes y contenido, con límites de crecimiento y filas elegidas automáticamente; no traduce únicamente props a Flexbox. El campo corto mantiene su límite incluso solo. La libertad sobrante es deliberada y puede alinearse; es un cambio de política frente al formulario r02.

## Anatomía y estados

Anatomía: contenedor; hijos estables; etiqueta, control, pie en campos; wrappers de filas de laboratorio; agrupación opcional; diagnóstico exterior sin región viva. Estados: ancho amplio, medio, estrecho y debajo de mínimos; vacío; campo corto solo; texto libre; contenido desconocido; números acotados; etiqueta larga; ayuda/error; hidden/reveal; agrupado/desagrupado; RTL/LTR; foco y edición durante resize; sin JS/antes de medición.

Teclado: Tab/Shift+Tab nativos en orden DOM; editar controles nativos. El layout no agrega parada ni atajos. ARIA: no role=grid ni región viva para cambios de filas. Formulario de demo tiene nombre, labels for; grupo de números usa role=group con nombre. Los cambios de tamaño no anuncian cada cálculo.

## Criterios

| Criterio | Base | Resultado/limitación |
|---|---|---|
| Lectura, visual y Tab en secuencia, sin reordenar | WCAG 1.3.2 / 2.4.3 | Partición contigua del motor; 80 comprobaciones Chromium; preservación de foco e intervalo seleccionado durante resize |
| Etiquetas visibles y sin elipsis | WCAG 1.3.1 / 1.4.4 | Fuente medida; palabra puede partirse debajo de mínimo |
| Sin desborde horizontal | WCAG 1.4.10 | 2521 comprobaciones puras en anchos40–1120 y1–20 hijos; 80 comprobaciones Chromium en LTR/RTL y grupos |
| Foco visible y conservado | WCAG 2.4.7 / 2.4.3 | CSS neutro y mismo nodo; prueba de resize prevista |
| Área de control44px | Regla local y WCAG2.5.8 | Prototipo controles44px; producción independiente de tema |
| No reorganizar al escribir | Previsibilidad/usabilidad | No listener de input de campos; ancho solo de perfil |
| Defaults y configuración mínima | Decisión del usuario | Contenedor único; names y defaults pendientes |

## Comprobaciones

Ejecutadas: `node verify.mjs`: **2521 comprobaciones**; orden contiguo, no overflow, máximo, compactos, rango y ejemplo Calle + dos números. Primer intento Chromium impedido por sandbox del sistema (bootstrap Mach), segundo intento autorizado: **80 comprobaciones Chromium correctas** a240/320/360/460/720/1120, LTR/RTL y grouped, Calle encima con dos números pequeños debajo a460, sin desborde, reveal/etiqueta larga/mensaje, foco e intervalo de selección2..8 backward tras resize; consola sin errores. Captura `preview.png`. Banco general adicional: avatar de tamaño natural, tarjeta flexible y tabla directa como fila completa; estructura presente, sin batería específica todavía.

No ejecutadas: VoiceOver/NVDA, móvil real, WebKit/Firefox, zoom200/400%, rendimiento con cientos de hijos, integración Vue, contratos, tokens y auditoría Coco. El coste del DP es cúbico en esta implementación sencilla; ámbito de ensayo1–20 hijos, no promesa para listas masivas. Inferencias por formato/capacidad existen en motor pero UI demuestra rango y respaldo; no registro real de componentes aún.

## Preguntas de producto realmente abiertas

Ninguna que detenga esta ronda, conforme autorización de alcance y autonomía. Lima define nombre/API, defaults y grupos dentro de la dirección acordada; no se pide al usuario decidir medidas ni algoritmo. Mantener implementación opt-in sin cambiar GFormRow salvo mandato posterior.

Medición preliminar del orquestador: planner puro en Node,10 repeticiones,1024px y gap12: medianas10 hijos0,71ms,50 hijos2,39ms,200 hijos9,44ms; máximos2,66/3,94/12,26ms. Sin DOM, sin umbral ni garantía móvil.

## Hallazgos para lima

L1. Reconciliar #171–175 y #172 con nuevo contenedor opt-in; decidir si planificador compartido se generaliza conservando comportamiento antiguo.
L2. Contrato de publicación de perfil por componentes: mínimo/preferido/máximo/peso, invalidación por tema/fuente/locale/etiqueta/formato y desconexión al desmontar. Valores min/max numéricos no siempre implican campo visual corto (decimales, unidad, botones).
L3. Resolver desconocidos, hints semánticos opcionales, capacidad ilimitada y etiquetas localizadas. No reutilizar size de altura como ancho.
L4. Agrupar visualmente sin romper fieldset/legend, GFormReveal ni tres pistas etiqueta/caja/pie del formulario; el prototipo alinea raíz, no subgrid completo.
L5. Nombre/API y límites documentados; definir coeficiente/política de compresión y respaldo, sin exponerlos si usuario no los necesita.
L6. Minimizar movimiento de nodos en producción, foco, SR y actualizaciones; observer+rAF reutilizable de rowEngine.
