# Estilo · isla de estado r04 · la cápsula de D1 (coco)

> **Decisión del usuario (§10): L1 · Grafito esmerilado en claro + el oscuro de V2C con filo.** Es lo que queda fijado para `GStatusIsland.css` y `GStatusMark.css`. §1 a §9 son la exploración que llevó hasta aquí.
>
> **Ronda 2 (§9):** el usuario: «me gusta el V2C oscuro, pero el claro no, de ninguno». El oscuro de V2C queda fijado y §9 propone tres claros (L1, L2, L3). **La pregunta vigente es la de §9.6**; la de §8 queda sustituida.

**Encargo:** el usuario eligió **D1 · Cápsula de relevo** y pidió: «en el diseño de la pill mejóralo, hazlo más atractivo, visual, moderno», con la referencia «algo estilo Apple». Después, al ver las capturas: «Cristal se ve bien en modo oscuro, pero creo que el detalle en la versión en blanco es que se pierde».
**Estructura y movimiento:** los de kiwi (`declaracion.md` §6.1 a §6.3), **sin cambios**. **Reglas:** `docs/documentacion/auditoria-visual.md` (§1 a §5) y `docs/documentacion/rubrica-movimiento.md` (dimensiones B y lo visual de D y F).
**Banco:** `estilo-banco.html` + `estilo-banco.js`. El script es la lógica D1 de `index.html` copiada sin cambios. `?v=V1|V2|V2C|V3`, `&theme=dark`, `&vista=galeria|comparativa|cristal`, `&dir=rtl`. No se ha tocado `GStatusIsland.css`, el `.vue`, el contrato ni `index.html`.
**Verificación:** `node design/lab/alert/r04/estilo-verificar.mjs [--capturas]` (puerto 4214; `VARIANTS=L1,L2,L3` para la ronda 2: 560/573 en la pasada completa, 561 tras aislar la prueba del anillo, §9.3). Ronda 1: **752/764** en Chromium, Firefox y WebKit. Los 12 fallos son todos de la misma clase: el cristal no se delimita frente a algunas zonas de marca (§3). V1 y V3 dan 100 %.

## 1. Auditoría previa: la cápsula de D1 tal cual (brief §1 y §3)

Medido sobre `index.html?p=D1` (kiwi) y su `verificar.mjs`; los siete puntos de kiwi (§6.5) son el punto de partida.

| Aspecto | D1 tal cual | Valoración |
| --- | --- | --- |
| **Jerarquía** | Insignia de 32 px con disco saturado e icono de 18 px; título de 16 px en `action-weight` (500). La insignia pesa más que el título (kiwi 2) | No cumple: compite con el texto |
| **Delimitación** | Superficie inversa más un anillo de 1 px del color de la página («doble filo»). Página 17,4:1, superficie 17,4:1, zona 16,48:1. Sin el anillo, frente a la zona: **1,06:1** (#692 no se sostiene en el tema por defecto) | Cumple, pero el anillo es un trazo y no un diseño (kiwi 1) |
| **Proporciones** | Fila de 48 px; la insignia empieza a 8 px del extremo y queda a 8 px de arriba; radio de mitad del alto | Proporción de botón grande y no de isla (kiwi 3) |
| **Tipografía** | 16/500 en una línea; descripción de 14 | Pesada para un titular breve |
| **Sombra y borde** | `shadow-2` (10 % de negro) más el anillo de la página | Sin profundidad; en oscuro no se ve (kiwi 1) |
| **Anillo de tiempo** | Trazo SVG `stroke-dashoffset: calc(100 - var(--_left) * 100)`. **En Firefox el `calc()` sin unidades se descarta**: el anillo se ve **siempre lleno** (medido: `0px` frente a `70px` en Chromium y WebKit) | **Defecto** (para kiwi y bruno, §7) |
| **«+N» y chevrón** | Texto suelto al final, sin agrupar (kiwi 4) | Sin jerarquía |
| **Asomo y lista** | Botones contorneados blancos y teselas con velo del 9 % (kiwi 5) | Parece un panel de formulario |
| **Estados** | Pausa invisible: el anillo se para, pero no cambia nada a la vista. El foco del resumen abre el asomo, así que no existe un «foco en la línea» | Falta la pausa |
| **Oscuro** | Cápsula casi blanca (#F2F2F2) sobre #141414: salto de brillo de 16,46:1 (kiwi 6) | Llama más que el contenido |
| **Reducido, 320 px, dianas** | Cumplen (`verificar.mjs` de kiwi, 360/360) | Cumple |

**Qué cambiar:** proporción y tipografía de isla, insignia subordinada al título, profundidad real, «+N» agrupado, asomo como continuación de la cápsula, pausa visible, el tono en oscuro y el anillo en Firefox. **Qué podría romper comportamiento:** nada de lo anterior. Los tres detalles de marcado (§5) son presentacionales.

## 2. Común a las cuatro variantes (lo que ya mejora frente a D1)

| Pieza | Valor | Por qué |
| --- | --- | --- |
| Fila | 40 px (V1), 44 (V2 y V2C), 36 (V3). Con `pointer: coarse`, 44 px por dentro del borde | Más baja y con más aire: proporción de isla |
| Insignia | 24 px, concéntrica (hueco al inicio = hueco arriba, medido Δ ≤ 1 px en LTR y RTL) | Se subordina al título |
| Título | 14 px / `title-sm-weight` (600) | Titular breve y nítido, como la referencia |
| Anillo de tiempo | Degradado cónico recortado a corona: grosor de 2 bordes, arranca arriba y va en el sentido del reloj. Su pista se ve | **Funciona en Firefox**. Sin literales: `1turn` y `--g-border-width` |
| **Pausa visible** | Con `data-paused="true"` la pista del anillo se completa (pasa del 18 al 45 % de la tinta). No hay movimiento | La pausa se ve sin animar nada |
| «+N» y chevrón | Un solo grupo al final (`d1__tail`); «+N» en una cápsula de 20 px (`caption`, 600, tabular); el chevrón gira 180° en el asomo (`slow` + muelle, nada con `reduce`) | Elemento final de la isla |
| Asomo | La descripción y la acción arrancan donde arranca el título (Δ 0 px). La acción es una cápsula rellena de tinta; «Ir a…» y el enlace, texto subrayado; «Ocultar», texto | Continuación de la cápsula y no un panel |
| Lista | Renglones sin teselas, con un separador sangrado desde el texto, como una lista agrupada. Se oculta el rótulo «Pendiente», que duplicaba el resumen. Desplaza por dentro si pasa del visor | Se lee como la isla abierta |
| Radio | La mitad de la fila en todos los estados (la lista también) | Una sola familia de forma |
| Sombra | Dos capas: `shadow-1` (cerca) y `shadow-3` (lejos), las de la **página** también dentro de una zona | Profundidad sin decoración |
| Marca junto al origen | El mismo material que la cápsula, a escala de control (32 px, insignia de 20 concéntrica) | Un solo lenguaje |

## 3. Las variantes

### V1 · Tinta (superficie inversa, #325 tal cual)
- **Qué la hace distinta:** es la isla de hoy pulida, sin cambiar de decisión. Cápsula de tinta opaca con un filo de luz arriba (la tinta al 18 %) y el doble filo del color de la página. Disco del tipo con su icono y, alrededor, el anillo de tiempo en la tinta.
- **Frente a D1:** todo lo de §2. **Frente a la isla actual:** fila de 40 y no de 48, insignia de 24 y no de 32, sin contorno de estilo en la insignia (el tipo se reconoce por la forma del icono y el prefijo oculto), sombra en dos capas, filo de luz.
- **Coste:** en oscuro sigue siendo una cápsula casi blanca (salto de brillo de 16,46:1, kiwi 6). `forced-colors`: borde `CanvasText`. Peso: nada nuevo.

### V2 · Cristal (material del sistema, `tokens.md` §12)
- **Qué la hace distinta:** velo translúcido con `--g-glass-filter`, filo luminoso arriba (`--g-glass-edge`), brillo especular (`--g-glass-sheen`) y sombra en dos capas. Se adapta al esquema: blanco esmerilado en claro, grafito en oscuro. Insignia en el tono suave del tipo. Toda la tinta es `--g-color-text`, la única garantizada sobre el peor fondo del cristal; por eso el anillo y el foco van en la tinta y no en el color del tipo (medido: con `danger-text` caía a 2,09:1 sobre negro). Hilo de `--g-color-border-control`.
- **Coste:** **en claro se pierde** (el reporte del usuario). Medido: el relleno queda a **1,00:1** frente a la página y a la superficie; solo el hilo la delimita (3,45:1); el disco de la insignia queda a **1,12:1** de la cápsula, así que la insignia pierde su forma y queda solo el glifo; la sombra clara (`shadow-3`, 18 %) no basta. Frente a la zona de marca, 8 de 22 temas × esquemas bajan de 3:1 (1,79 a 2,83). Contradice #325 y #692 (deja la inversa). `backdrop-filter` cuesta en GPU.

### V2C · Cristal corregida (respuesta al reporte; **el oscuro es el de V2, idéntico**)
- **Qué cambia, solo en claro**, con `light-dark(claro, oscuro)` en cada valor. `light-dark()` sigue a `color-scheme`, que ya fija `defaults.css` en cada esquema (y el CLI lo emite):
  1. Esmerilado con cuerpo: el tinte del cristal con un 8 % de la tinta. El relleno pasa de 1,00 a 1,12:1: deja de ser blanco sobre blanco.
  2. El hilo de control con un 30 % de la tinta: **5,78:1** frente a la página, en vez de 3,45. El borde se ve como borde.
  3. Una capa de sombra propia, solo en claro: desplazamiento y difuminado de `space`, color de la tinta al 12 %. En oscuro es transparente.
  4. La insignia con el **disco pleno del tipo** (`--g-color-{tipo}` + `on`): el disco pasa de 1,12 a 1,70:1 frente a la cápsula y el glifo sigue ≥ 4,5.
  5. Un segundo filo exterior con la tinta de la zona al 75 %. En la página es blanco sobre blanco y no se ve; frente a la cabecera de marca, en claro, pasa de 1,79 a **≥ 3:1 en los 11 temas**.
- **El oscuro no cambia:** medido igual que V2 en los tres motores (relleno 1,06:1, delimitación 4,66 / 4,32 / 4,17, disco 1,07).
- **Coste que queda:** en oscuro, sobre una zona de marca oscura de 4 temas (grana, caracol-púrpura, linear, stripe), 2,03 a 2,69:1. Con página y zona oscuras, un filo invisible en la página no puede verse en la zona; arreglarlo pide un filo claro también en oscuro, que cambia el oscuro que gusta. `light-dark()` es un precedente nuevo en los componentes (§7). Contradice #325 y #692.

### V3 · Obsidiana (la isla dinámica: profunda en claro y en oscuro)
- **Qué la hace distinta:** la cápsula es una **zona de marca** (`data-g-zone="brand"`). Dentro, superficie, tinta, tinta secundaria, `{tipo}-text`, acento y foco son los de la zona, con contraste ≥ 4,5:1 garantizado por la guarda del CLI (§44). El tipo es el color del **glifo** y del **anillo**, sin disco; la cuenta atrás va en el ámbar de la zona; la acción, en tinta invertida (#634). Fila de 36. Filo exterior con la tinta de la zona al 75 %: blanco sobre blanco en claro y un hilo de luz en oscuro.
- **Medido:** 109/109 en Chromium (24 temas × esquemas) y 41/41 en Firefox y WebKit. Delimitación mínima 3,35; texto mínimo 4,53. En oscuro, salto de brillo de 1,12:1: no deslumbra.
- **Coste:** en un tema con marca de color **la isla toma el color de la marca** (`estilo-V3-tema-spotify.png`: una isla verde; stripe, morada; caracol, burdeos). Choca con #325 y `tokens.md` §2 («nunca `brand`»). Para tenerla neutra en todos los temas, lima tendría que abrir la zona `inverse` reservada en #621 con fuentes profundas propias.

## 4. Auditoría posterior (brief §3 y rúbrica)

**Recuento** (`estilo-verificar.mjs`, 2026-10-19):

| | V1 | V2 | V2C | V3 |
| --- | --- | --- | --- | --- |
| Chromium (24 temas × esquemas) | 109/109 | 101/109 | 105/109 | 109/109 |
| Firefox (tema por defecto, claro y oscuro) | 41/41 | 41/41 | 41/41 | 41/41 |
| WebKit (ídem) | 41/41 | 41/41 | 41/41 | 41/41 |

**Mínimos medidos** (todos los temas y esquemas):

| | V1 | V2 | V2C | V3 |
| --- | --- | --- | --- | --- |
| Texto (≥ 4,5) | 15,20 | 5,99 | 5,52 | 4,53 |
| Glifo, anillo, chevrón, acción y foco (≥ 3) | 4,81 | 4,51 | 4,51 | 4,70 |
| Delimitación, tema por defecto, claro (página / superficie / zona) | 17,4 / 17,4 / 16,48 | 3,45 / 3,45 / 7,09 | **5,78 / 5,78 / 9,75** | 16,48 / 16,48 / 9,75 |
| Delimitación, tema por defecto, oscuro | 16,46 / 15,22 / 14,72 | 4,66 / 4,32 / 4,17 | 4,66 / 4,32 / 4,17 | 10,59 / 10 / 9,75 |
| Delimitación mínima en los 11 temas | 4,20 | 1,79 | 2,03 | 3,35 |
| Salto de brillo cápsula/página, oscuro | 16,46 | 1,06 | 1,06 | 1,12 |

**Qué mide cada variante, en cada motor:**
- **Comportamiento sin cambios** (17 comprobaciones): un anuncio enérgico y el foco en «Guardar»; nace como cápsula sin texto desde el borde sin pasar de su tamaño; pausa y asomo; se recoge subiendo; eco; la marca trae la lista; Esc; relevo con «+2»; cuenta atrás; Alt+F8; un solo par de canales.
- **Contraste:** sobre la galería (los mismos nodos, quietos). El cristal se mide contra el peor fondo: negro, blanco y los tres fondos.
- **`forced-colors`** (Chromium): cápsula, insignia, anillo, acción, foco y marca con colores del sistema.
- **Tamaños:** 320 px; texto al 200 % a 1100 y a 640 px (sin desplazamiento horizontal ni recorte); dianas ≥ 24 y ≥ 44 con `coarse`.
- **Movimiento reducido:** nada se mueve, y el anillo sigue diciendo el tiempo sin animarse.
- **Alineación** en LTR y RTL: insignia concéntrica, centros alineados, columna de texto, aire final ≥ inicial.

**Capturas:** `estilo-{V1,V2,V2C,V3}-{claro,oscuro}.png` (estados de la línea, asomo, foco, lista y marca; sobre página, tabla y zona). `estilo-comparativa-{claro,oscuro}.png`, `estilo-cristal-{claro,oscuro}.png` (V2 junto a V2C) y `estilo-V3-tema-{spotify,stripe,caracol-purpura}.png`.

### Rúbrica (B y lo visual de D y F)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| **B · Profundidad coherente** | Cumple (V1, V2C, V3); Parcial (V2) | Una sola fuente de luz: filo arriba, sombra cercana y lejana hacia abajo, sin señales contrarias. V2 en claro no tiene cuerpo (relleno 1,00:1) | Bajo / Medio (V2) | V2C en lugar de V2 |
| **B · Cambios de brillo al nacer y al recogerse** | Cumple (V2, V2C, V3); Parcial (V1 en oscuro) | Opacidad por cuadro ≤ +0,30 / −0,27 en los tres motores, sin destellos. V1 en oscuro mete un objeto casi blanco de 16,46:1 sobre la página | Medio (V1 en oscuro) | Si se elige V1, valorar un tono menos brillante en oscuro (token, lima) |
| **B · Contraste y delimitación sobre tres fondos** (riesgo 3 del agente principal) | Cumple (V1, V3); Parcial (V2C); No cumple (V2) | §4. La isla de hoy está a 1,06:1 sobre la zona; V1 a 16,48 y V3 a 9,75 (≥ 3,35 en todos los temas); V2C a 9,75 en claro y 4,17 en oscuro con el tema por defecto, pero 2,03 a 2,69 en 4 zonas oscuras | Medio (V2C) / Alto (V2) | V3 o V1 si la zona es crítica; con V2C, aceptar o decidir un filo en oscuro |
| **D · Fundido y escala sin flashes** | Cumple | Nacer y recogerse: los de kiwi; saltos de opacidad medidos ≤ 0,30 por cuadro; con `reduce`, solo fundidos | Bajo | Ninguna |
| **F · Información sin depender del movimiento** | Cumple | Tipo por la forma del icono y el prefijo oculto; el anillo cambia por estilo y no por animación (con `reduce` se acorta igual); la pausa se ve como pista llena | Bajo | Ninguna |
| **F · `forced-colors`** | Cumple (emulado en Chromium) | Borde `CanvasText`, contorno de la insignia, anillo en `CanvasText`, acción `ButtonText`, foco visible. El cristal pierde el desenfoque (no aporta información) | Bajo | Verificarlo en Windows real |

## 5. Comparativa y recomendación

| | V1 · Tinta | V2 · Cristal | **V2C · Cristal corregida** | V3 · Obsidiana |
| --- | --- | --- | --- | --- |
| Material | Opaco, se invierte en oscuro | Translúcido, acompaña al esquema | Translúcido; en claro, esmerilado con cuerpo | Opaco y profundo en los dos esquemas |
| Claro | Negro | Blanco que se pierde | Gris esmerilado con borde | Negro |
| Oscuro | Casi blanco (deslumbra) | Grafito (gusta) | **El mismo grafito** | Negro con hilo de luz |
| Tipo | Disco de color | Disco suave (se pierde en claro) | Disco pleno en claro, suave en oscuro | Glifo y anillo de color |
| Decisión vigente | Dentro de #325 y #692 | Las enmienda | Las enmienda | Las enmienda; marca de color = isla de color |
| Verificado | 191/191 | 183/191 | 187/191 | 191/191 |

**Recomendación: V2C · Cristal corregida.** Al usuario le gusta el oscuro del cristal, y V2C lo conserva idéntico. En claro corrige lo que se perdía (borde a 5,78:1, cuerpo, disco del tipo, filo frente a la zona) y, al seguir al esquema, no deslumbra en oscuro como V1 ni se tiñe de marca como V3. Con esa corrección **el cristal pasa a ser mi recomendación**; sin ella (V2) no lo sería. Le queda un coste medido: sobre una zona de marca oscura de 4 temas del CLI no llega a 3:1 en oscuro. Si la isla va a pasar a menudo sobre una zona oscura, la alternativa es **V3**: es la única que pasa todo, pero en un tema de color la isla es del color de la marca, salvo que lima abra la zona `inverse` (#621).

## 6. Informe (brief §5)

- **Cumplimientos** (ya los cumplía D1): estructura, orden y anuncios; contraste de texto; foco visible; 320 px; movimiento reducido; nada se mueve en la página.
- **Correcciones** (D1 → variantes):
  - proporción de isla (36 a 44 px, insignia de 24 concéntrica);
  - título 14/600;
  - insignia subordinada al título;
  - profundidad en dos capas;
  - «+N» y chevrón agrupados;
  - asomo y lista como continuación de la cápsula;
  - **pausa visible**;
  - **anillo que funciona en Firefox** (antes, siempre lleno);
  - lista que desplaza por dentro;
  - dianas de 44 con `coarse`;
  - la delimitación frente a la zona garantizada por la tinta de la zona (V3, V2C en claro);
  - el claro de Cristal (V2C).
- **Pendientes:**
  - elegir variante (§8);
  - con V2C, la delimitación en oscuro frente a 4 zonas oscuras del CLI;
  - con V3, la isla neutra en temas de color (lima);
  - no verificados: Safari y `forced-colors` reales, lector de pantalla, táctil real (el toque abre la lista: kiwi), rendimiento de `backdrop-filter` en equipos modestos (V2/V2C, rúbrica G) y la isla sobre fotografías o vídeo.

## 7. Hallazgos para otros roles

**Para lima (tokens y decisiones):**
1. Si se elige V2C o V3, **enmendar #325 y #692** (la isla deja la superficie inversa). Con V2C, el material es el cristal de §12 sin tokens nuevos.
2. **`light-dark()` en un componente** es un precedente nuevo (V2C). Depende de que `color-scheme` siga al esquema, cosa que hoy hacen `defaults.css` (`:root`, la consulta, `[data-theme="dark"]` y la zona) y los temas del CLI. Anotar la regla: un tema que redeclare los colores sin `color-scheme` rompería la rama.
3. Con V3, decidir entre **isla de la marca** (zona `brand` tal cual) e **isla neutra**. La isla neutra exige la zona `inverse` reservada en #621, con fuentes profundas en los dos esquemas.
4. La capa de sombra solo en claro de V2C se arma con `space` y la tinta al 12 %. Si se adopta, valorar un token `--g-shadow-lift` para no repetir la receta.
5. Ningún valor nuevo de tema hace falta para V1.

**Para kiwi (prototipo r04):**
1. **Defecto:** el anillo de `index.html` se ve siempre lleno en Firefox (el `calc()` sin unidades de `stroke-dashoffset` se descarta). El banco lo resuelve con un degradado cónico.
2. El rótulo «Pendiente» de la lista duplica el resumen «Pendiente (N)».
3. «+N» y el chevrón están fuera del botón del resumen: pulsar el chevrón no hace nada.
4. El banco cambia tres detalles de marcado: `data-g-zone="brand"` en la cápsula y la marca (V3), `ring__track` y el envoltorio `d1__tail`.

**Para bruno:**
1. El anillo, con el degradado cónico y no con trazo.
2. `light-dark()` necesita Chrome 123, Firefox 120 y Safari 17.5.
3. El rendimiento de `backdrop-filter` en la cápsula que cambia de tamaño (rúbrica G, riesgo 4 del agente principal).

## 8. Pregunta de elección (ronda 1, sustituida por §9.6)

~~**¿Qué cápsula dejamos para la isla: V1 · Tinta (la de hoy, pulida), V2C · Cristal corregida (recomendada: tu oscuro intacto y el claro arreglado) o V3 · Obsidiana (siempre profunda, como la isla del iPhone, pero del color de la marca en temas de color)?** Si eliges V2C o V3, la isla deja la superficie inversa de #325 y #692. ¿Lo confirmas?~~ Respondida: el oscuro de V2C sí; ningún claro.

## 9. Ronda 2 · solo el claro, con el oscuro de V2C fijado

L1, L2 y L3 son V2C con otra rama clara: cada valor va en `light-dark(claro, oscuro)` y la rama oscura es la de V2C. **Medido idéntico** en los tres motores: relleno 1,06:1, delimitación 4,66 / 4,32 / 4,17, disco 1,07, texto 6,01. Banco: `?v=L1|L2|L3`, `&vista=par` (claro junto a su oscuro) y `&vista=propuestas`. Marcado: `data-v="V2C"` + `data-l`.

### 9.1 Por qué los claros de la ronda 1 fallan a la vista (frente al oscuro de V2C)

El oscuro de V2C gusta porque **es un material y no una pieza de interfaz**: un cuerpo translúcido que deja ver, apagado, lo que pasa por detrás; un filo de luz arriba que le da volumen; una insignia callada (disco tenue, glifo); y casi ningún salto de brillo con la página. Es un objeto que flota.

- **V1 (Tinta) en claro:** losa negra opaca y plana, sin filo de luz ni translucidez. El disco saturado grita; el asomo es una caja negra. Pesa más de lo que dice.
- **V2 y V2C (Cristal) en claro:** blanco sobre blanco. El cuerpo desaparece, así que todo lo sostiene un hilo gris, y eso es exactamente lo que dibuja un **campo de formulario o un chip**, no una isla. Sobre la cabecera de marca se vuelve un gris sucio.
- **V3 (Obsidiana) en claro:** acierta en la idea (oscura sobre claro, como la isla del iPhone), pero es una placa plana sin material, casi igual a V1. Con una marca de color se tiñe.

**La clave:** en claro la isla también debe ser **oscura**, y llevar las mismas señales del oscuro de V2C (material, filo de luz, insignia callada) para que sea **el mismo objeto** en los dos esquemas.

### 9.2 Las tres propuestas para el claro

Comunes a L1 y L2:
- tinta `--g-color-surface` sobre el cuerpo `--g-color-text` (par garantizado, neutro con cualquier marca, a diferencia de V3);
- insignia **callada** como en el oscuro: disco del color del tipo al 40 % y glifo en la tinta;
- la acción, una cápsula clara;
- filo exterior con la tinta de la zona al 75 % (no se ve en la página y separa de una cabecera de marca);
- una capa de sombra propia en claro (`space` y la tinta al 22 %).

**L1 · Grafito esmerilado.** El material del oscuro de V2C llevado al claro: cuerpo translúcido de la tinta del tema al 84 % que desenfoca lo de detrás (se ve sobre la tabla), filo de luz y brillo especular suaves (la tinta clara al 22 % y al 12 %).
- **Qué la hace distinta:** es el único claro que es el *mismo material* que el oscuro; solo cambia la luz.
- **Coste:** `backdrop-filter` en GPU, como V2C.

**L2 · Obsidiana neutra.** Isla oscura **opaca y mate** de la tinta del tema, sin brillo: solo un hilo de luz arriba.
- **Qué la hace distinta:** la más nítida y la más cercana a la isla del iPhone; con cuerpo opaco el desenfoque no se ve. Frente al oscuro de V2C es el mismo objeto, pero «sólido» en claro y «cristal» en oscuro.
- **Coste:** el mayor salto de brillo con la página (17,4:1, aunque sin destello); en claro la translucidez se pierde.

**L3 · Porcelana.** La única clara, con estructura de objeto y no de campo: cuerpo opaco de superficie, hilo con un 45 % de la tinta (7,56:1), filo interior de luz, sombra propia más presente y disco pleno del tipo.
- **Qué la hace distinta:** respeta el claro del tema.
- **Coste:** sigue siendo una cápsula clara sobre página clara (cuerpo 1,00:1); se lee como la mejor versión del chip, no como la isla. Se incluye como control.

Ninguna necesita tokens nuevos. Usan `--g-color-text`/`-surface`, `--g-glass-*` (la rama oscura) y la fuente `--g-color-on-brand-zone`.

### 9.3 Auditoría posterior (`estilo-verificar.mjs`, 2026-10-19)

**Recuento:**

| | L1 | L2 | L3 |
| --- | --- | --- | --- |
| Chromium (24 temas × esquemas) | 105/109 | 105/109\* | 105/109 |
| Firefox | 41/41 | 41/41 | 41/41 |
| WebKit | 41/41 | 41/41 | 41/41 |

**Mínimos en claro, en los 11 temas:**

| | L1 | L2 | L3 |
| --- | --- | --- | --- |
| Texto | ≥ 5,99 | ≥ 5,99 | ≥ 5,99 |
| Glifo, anillo, acción y foco | ≥ 4,51 | ≥ 4,51 | ≥ 4,51 |
| **Delimitación en claro** (todas las combinaciones pasan; con el tema por defecto, página / superficie / zona) | 10,59 / 10,59 / 9,75 | 17,4 / 17,4 / 9,75 | 7,56 / 7,56 / 16,48 |

**Los 4 fallos de cada fila de Chromium** son siempre los mismos: la rama oscura heredada de V2C frente a la zona de marca oscura de grana, caracol-púrpura, linear y stripe (2,03 a 2,69:1). Son del oscuro fijado, no de las propuestas (§3, V2C).

\*L2 dio 104/109 en la pasada completa: un falso fallo de la comprobación «el anillo sigue diciendo el tiempo con `reduce`», porque el relevo rearmó el anillo a mitad de la medida. Corregido el aislamiento de la prueba, da 43/43 dos veces seguidas en Chromium con el tema por defecto.

**Capturas:**
- `estilo-propuestas-claro.png`: L1, L2 y L3 en claro junto al oscuro de V2C.
- `estilo-L{1,2,3}-claro-y-oscuro.png`: cada propuesta con sus dos esquemas.
- `estilo-L{1,2,3}-claro.png`: todos los estados en claro.

### 9.4 Rúbrica (B y lo visual de D y F)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| B · Profundidad coherente entre esquemas | Cumple (L1); Parcial (L2, L3) | L1: mismo material y misma luz en los dos esquemas. L2: sólido en claro y cristal en oscuro. L3: claro en claro y oscuro en oscuro | Bajo / Medio | L1 si se quiere un solo objeto |
| B · Cambios de brillo al nacer y al recogerse | Cumple | Opacidad por cuadro ≤ +0,30 / −0,26 en los tres motores. Salto cápsula/página en claro: L1 10,59, L2 17,4, L3 1,0. Oscuro sobre claro es el caso de la isla de referencia; el fundido de 240 ms evita el destello | Bajo | Ninguna |
| B · Delimitación sobre tres fondos (riesgo 3) | Cumple en claro (11 temas); Parcial en oscuro (heredado) | §9.3 | Medio (solo el oscuro de V2C sobre 4 zonas oscuras) | Decidir si el oscuro gana un filo en zonas oscuras |
| D · Sin flashes | Cumple | Igual que la ronda 1 | Bajo | — |
| F · Sin depender del movimiento; `forced-colors` | Cumple | Anillo por estilo, pausa visible, tipo por la forma; `forced-colors` emulado | Bajo | Verificarlo en Windows real |

### 9.5 Comparativa y recomendación

| | L1 · Grafito | L2 · Obsidiana neutra | L3 · Porcelana |
| --- | --- | --- | --- |
| Claro | Oscuro translúcido | Oscuro opaco y mate | Claro con estructura |
| ¿El mismo objeto que el oscuro de V2C? | **Sí**: el mismo material | Casi: la misma forma, otro acabado | No |
| Estilo Apple | Material oscuro de iOS | Isla del iPhone | Aviso claro de iOS |
| Coste | GPU (desenfoque) | Salto de brillo mayor | Sigue pareciendo un chip |

**Recomendación: L1 · Grafito esmerilado.** Es la única en la que claro y oscuro son **el mismo objeto**: el material que gustó en oscuro, con la luz del claro. Es oscura sobre claro como la isla de referencia y no se tiñe con la marca. Pasa la delimitación en claro en los 11 temas (≥ 9,75 con el tema por defecto). Si se prefiere una isla sólida y más barata, **L2**.

**Informe (brief §5):**
- **Cumplimientos:** el oscuro de V2C intacto (medido); comportamiento y movimiento de kiwi intactos; texto ≥ 5,99 y gráficos ≥ 4,51 en todos los temas.
- **Correcciones:** el claro deja de ser blanco sobre blanco (L1 10,59:1, L2 17,4:1 frente a la página); la insignia callada como en el oscuro; la delimitación frente a la zona en claro ≥ 3 en los 11 temas.
- **Pendientes:**
  - el oscuro heredado frente a 4 zonas oscuras;
  - para lima: `light-dark()` como precedente y la enmienda de #325 y #692 (la isla deja la superficie inversa);
  - no verificados: Safari real, `forced-colors` real y el coste de `backdrop-filter` en equipos modestos (L1).

### 9.6 Pregunta de elección

**Con el oscuro de V2C fijado, ¿qué claro quieres: L1 · Grafito esmerilado (recomendada: el mismo cristal oscuro, también sobre fondo claro), L2 · Obsidiana neutra (isla oscura sólida, como la del iPhone) o L3 · Porcelana (cápsula clara con estructura)?**

## 10. Decisión (2026-10-19): lo que queda fijado para `GStatusIsland.css` y `GStatusMark.css`

**Elegido por el usuario:** **L1 · Grafito esmerilado** en claro, y el **oscuro de V2C con un filo** que lo delimita sobre las zonas de marca oscuras. En el banco: `estilo-banco.html?v=L1` (reglas `.isle[data-l=L1]` sobre la base `[data-v^=V2]` / `V2C`). En el CSS real no habrá variantes: se escriben solo estos valores.

### 10.1 El filo del oscuro (aplicado y medido)

Dos piezas, solo en la rama oscura de `light-dark()`:
1. El hilo exterior de 1 px pasa de `--g-color-border-control` a `color-mix(in oklab, var(--g-color-border-control), var(--g-color-text) 30%)`. Es la luz que separa la cápsula de las zonas oscuras profundas (grana y caracol-púrpura).
2. Un segundo anillo exterior de 2 px con el color de la **página** (`--g-color-bg`, resuelto fuera de cualquier zona). Separa la cápsula de las zonas oscuras de tono medio (linear y stripe); sobre la página no se ve.

**Medido:**
- Antes, frente a las cuatro zonas: 2,03 / 2,66 / 2,65 / 2,69:1. Ahora, delimitación mínima en los 11 temas, claro y oscuro: **3,10:1**. Con el tema por defecto en oscuro: página 7,11, superficie 6,58, zona 6,36 (antes 4,66 / 4,32 / 4,17).
- **Fuera de las zonas, el oscuro es idéntico** salvo el tono de ese hilo (de #808080 a ≈ #9C con el tema por defecto). Relleno (1,06:1), tinta, insignia (disco 1,07:1), filo de luz superior, brillo, sombras y movimiento no cambian. El anillo de la página es invisible sobre la página.
- La subida mínima que pasa en los 11 temas fue 30 %: al 25 %, grana quedaba a 2,89.

### 10.2 Lo fijado

| Pieza | Claro (L1) | Oscuro (V2C + filo) |
| --- | --- | --- |
| Cuerpo | `color-mix(in srgb, var(--g-color-text) 84%, transparent)` + `backdrop-filter: var(--g-glass-filter)` | `color-mix(in srgb, var(--g-glass-tint) calc(var(--g-glass-opacity) * 100%), transparent)` + el mismo filtro |
| Tinta (texto, iconos, anillo, chevrón, foco interior) | `--g-color-surface` | `--g-color-text` |
| Acción (cápsula rellena) | fondo `--g-color-surface`, texto `--g-color-text`; al pasar, la tinta al 86 % con su par | fondo `--g-color-text`, texto `--g-color-surface`; ídem |
| Filo de luz superior (inset 1 px) | `color-mix(in srgb, var(--g-color-surface) 22%, transparent)` | `--g-glass-edge` |
| Brillo especular (degradado de arriba al 55 %) | `color-mix(in srgb, var(--g-color-surface) 12%, transparent)` | `--g-glass-sheen` |
| Hilo exterior (1 px) | transparente | `color-mix(in oklab, var(--g-color-border-control), var(--g-color-text) 30%)` |
| Anillo exterior (2 px) | `color-mix(in srgb, var(--g-color-on-brand-zone) 75%, transparent)` | `--g-color-bg` de la página |
| Sombra | capa propia `0 space×3 space×8 −space×2` con `color-mix(in srgb, var(--g-color-text) 22%, transparent)` + `--g-shadow-1` + `--g-shadow-3` | la capa propia transparente + `--g-shadow-1` + `--g-shadow-3` |
| Insignia (24 px, concéntrica) | disco `color-mix(in oklab, var(--g-color-{tipo}) 40%, transparent)`, glifo `--g-color-surface` | disco `--g-color-{tipo}-soft`, glifo `--g-color-on-{tipo}-soft` |
| Anillo de tiempo | degradado cónico de la tinta (`calc(var(--_left) * 1turn)`) recortado a corona de 2 bordes; pista: la tinta al 14 %; en pausa, al 40 % | ídem con la tinta del oscuro |
| «+N» | cápsula transparente con contorno de la tinta al 40 % | fondo `--g-color-surface`, contorno `--g-color-border` |
| Separadores de la lista | la tinta al 18 % | `--g-color-border` |
| Marca junto al origen | el mismo cuerpo, filo superior e hilo (sin anillo exterior ni sombra propia) | ídem |

**Comunes a los dos esquemas:**
- fila de `space × 11` (44 px), con `pointer: coarse` `44px + 2 bordes`;
- radio de la mitad de la fila;
- insignia de `space × 6` con el glifo al 62 %;
- título `body-sm` / `title-sm-weight`;
- «+N» y temporizador en `caption`;
- asomo y lista alineados con el título;
- movimiento de kiwi (§6.3) sin cambios: muelle en el chevrón y en el tamaño;
- con `reduce`, solo fundidos;
- `forced-colors`: borde `CanvasText`, contorno de la insignia, anillo `CanvasText` y acción `ButtonText`.

**Medido (191/191 en Chromium con 11 temas, Firefox y WebKit):**
- texto ≥ 5,99;
- glifo, anillo, acción y foco ≥ 4,51;
- delimitación ≥ 3,10 en los 11 temas;
- con el tema por defecto, en claro: página 10,59, superficie 10,59, zona 9,75;
- sin destellos al nacer ni al recogerse (≤ 0,29 de opacidad por cuadro);
- 320 px y texto al 200 % sin recorte;
- concéntrica en LTR y RTL.

**Capturas finales:** `estilo-L1-claro-y-oscuro.png` (los tres fondos, los dos esquemas) y `estilo-L1-claro.png` / `estilo-L1-oscuro.png` (todos los estados).

### 10.3 Tokens que consume (lista exacta para lima)

**Color:**
- `--g-color-text`, `--g-color-surface`, `--g-color-bg`, `--g-color-border`, `--g-color-border-control`, `--g-color-focus` (anillo exterior y eco de la marca).
- `--g-color-{danger|warning|info|success}`, `--g-color-{danger|warning|info|success}-soft`, `--g-color-on-{danger|warning|info|success}-soft`.
- `--g-color-on-brand-zone` ⚑.

**Cristal:** `--g-glass-tint`, `--g-glass-opacity`, `--g-glass-filter`, `--g-glass-edge`, `--g-glass-sheen`.

**Sombra:** `--g-shadow-1`, `--g-shadow-3`.

**Medidas:** `--g-space-1`, `--g-space-2`, `--g-space-3`, `--g-space-4`, `--g-space-8`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-radius-pill`.

**Texto:** `--g-font-ui`; `--g-text-body-sm-{size|line|tracking}`; `--g-text-title-sm-weight`; `--g-text-action-weight`; `--g-text-caption-{size|line|weight}`.

**Movimiento:** `--g-duration-{fast|press|slow|spin}`, `--g-ease-{out|standard|spring}`.

**Deja de consumir** (frente a la isla vigente, `tokens.md` §31): `--g-color-on-{tipo}` en las insignias (el claro usa el disco al 40 % con glifo `surface`; el oscuro, `-soft`/`on-…-soft`) y `--g-shadow-2`.

**Para lima, marcados ⚑ (precedente, regla o decisión; ningún token nuevo es imprescindible):**
1. ⚑ **Enmienda de #325 y #692:** la isla y su marca dejan la superficie inversa por un **cristal grafito en los dos esquemas** (claro: la tinta del tema translúcida; oscuro: el cristal de §12 con filo).
2. ⚑ **`light-dark()` en un componente** (primer uso). Depende de que `color-scheme` siga al esquema: hoy lo fijan `defaults.css` (`:root`, la consulta, `[data-theme="dark"]` y la zona) y los temas del CLI. Regla a escribir: un tema que redeclare los colores sin `color-scheme` rompe la rama.
3. ⚑ **`--g-color-on-brand-zone` leído fuera de la zona.** `tokens.md` §44.2 dice que las fuentes de la zona solo las leen el bloque `[data-g-zone]` y `GSurface`. La isla la usa (al 75 %) como el único color garantizado ≥ 4,5:1 frente a cualquier zona, para separarse de una cabecera de marca en claro. Necesita excepción documentada, o un alias, p. ej. `--g-color-zone-ink` de nivel Semantic.
4. ⚑ **Regla de contraste del cristal oscuro en claro** (§12 solo cubre la tinta oscura sobre el velo claro): la tinta `surface` sobre `text` al 84 %, contra el peor fondo (blanco), medido ≥ 5,99 en 11 temas. Proponer al CLI la misma guarda que §12 (opacidad mínima o contraste compuesto).
5. ⚑ **Insignia del claro:** disco `{tipo}` al 40 % con glifo `surface`. No es un par garantizado por construcción; está medido (glifo ≥ 4,51 en 11 temas). Lima decide si el CLI lo valida o si se escribe como par derivado.
6. Opcional: la capa de sombra solo en claro es una receta de `space` + la tinta al 22 %; si se repite en otros componentes, valorar un `--g-shadow-lift`.
7. Constantes de mezcla del componente (no son tema): 84 %, 30 %, 75 %, 40 %, 22 %, 12 %, 18 % y 14 %, más `1turn` en el anillo.

**Para bruno:**
1. El anillo con degradado cónico (no `stroke-dashoffset`: Firefox descarta el `calc()` sin unidades).
2. El `ResizeObserver` y la medida de kiwi sin cambios.
3. `light-dark()` requiere Chrome 123, Firefox 120 y Safari 17.5.
4. Valorar el coste de `backdrop-filter` en una forma que cambia de tamaño (rúbrica G).

## 11. Implementación (paso 3 del flujo)

Lo fijado en §10 está escrito en `GStatusIsland.css` y `GStatusMark.css` sobre las clases y datos de `status.md` (181c524). El documento de implementación, con la auditoría previa frente al CSS vigente, la coreografía y el solape de la salida, el muelle solo al crecer (M1), las medidas, la rúbrica y los encargos a bruno y a lima, es **`design/lab/alert/estilo.md`**. Banco: `design/lab/alert/estilo-banco.html`. Verificación: `node design/lab/alert/estilo-verificar.mjs`, **285/285** en Chromium (11 temas del CLI, claro y oscuro), Firefox y WebKit.

Dos correcciones de lima a este banco, aplicadas en el CSS real:
- el eco de la marca dura `--g-duration-slow`, no `slow × 3`;
- el chevrón gira con `--g-ease-out`, no con el muelle.

Este banco (`estilo-banco.html` de r04) queda como registro de la exploración.
