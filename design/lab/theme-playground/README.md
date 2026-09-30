# Theme Playground · Dark Color Presence (Fase 3)

**Estado:** laboratorio de investigación. **No** modifica el Theme Engine, el contrato de tokens, `primary`, la regla de niveles ni los semánticos. No se adopta ninguna de las hipótesis B ni C. No forma parte de los paquetes publicados (`@grana/vue`, `@grana/cli`).

Es la herramienta para **ver dinámicamente** la evidencia de las Fases 1 y 2 (`../tema-oscuro/investigacion-dark-color-presence.md`, `../tema-oscuro/dark-color-presence/`): los 11 temas del benchmark, en Light y Dark, con las hipótesis Current (A), B y C, y con las superficies experimentales, dentro de **componentes reales de `@grana/vue`**.

## Cómo usarlo

```bash
cd design/lab/theme-playground
npm install              # instala Playwright y las fuentes del laboratorio (solo aquí)
npm run setup            # copia las fuentes a fonts/ y genera fonts/fonts.css
npm run serve            # sirve el repo en http://localhost:4180   (requiere `npm run build` en packages/vue)
#   http://localhost:4180/design/lab/theme-playground/index.html
```

Estado por URL (y los selectores de la interfaz lo cambian **sin recargar** y actualizan la URL):

```
?theme=grana&scheme=dark&strategy=current
?theme=stripe&scheme=dark&strategy=b
?theme=caracol-purpura&scheme=dark&strategy=c&surface=high
```

| Parámetro | Valores | Nota |
| --- | --- | --- |
| `theme` | `notion`, `apple`, `medium`, `stripe`, `caracol-purpura`, `amazon`, `github`, `spotify`, `linear`, `grana`, `lustre` | Sale de `../tema-oscuro/dark-color-presence/themes/*.json` |
| `scheme` | `light`, `dark` | |
| `strategy` | `current` (A, lo que emite el motor), `b` (piso L ≥ 0.70), `c` (ΔE ≥ 0.50) | Solo afecta a Dark; B y C son **simulaciones** por fuera del motor |
| `surface` | `low`, `real`, `medium`, `high` | Condiciones **experimentales** (no son tokens ni opciones públicas): `surface` L 0.135, real ≈ 0.226, 0.20 y 0.275 |

Valores inválidos caen a `grana · dark · current · real`.

## Qué muestra

Todo con componentes reales de `@grana/vue` y los tokens del tema activo: **Theme Information Card** (tema, marca y acento, forma, fuentes y su estado, estrategia, superficie y colisiones), **Semantic Color Card** (HEX, L, C, contraste, ΔL y ΔE **leídos del DOM en vivo**), botones, inputs, checkbox, switch, badges, feedback semántico, **Card con primary + status + danger**, **Form Card**, **Surface Ladder** y **Semantic Stress Test** (cada semántico sobre cada nivel de superficie).

## Playwright

```bash
npm test                 # 36 pruebas (prepara las fuentes y arranca el servidor solo)
npm run shots            # capturas de demostración en screenshots/   (con el servidor en marcha)
npm run shots -- --all       # los 11 temas × current/b/c
npm run shots -- --surfaces  # los 11 temas con C × low/medium/real/high
```

`tests/playground.spec.mjs` verifica:

1. **Estado por URL** (las tres URL de ejemplo) y valores inválidos.
2. Que **cambia el tema** sin recargar (sin recarga, URL actualizada, tokens de color, radio y tipografía).
3. Que **cambia Light / Dark** y solo cambian tokens del grupo de color; al volver, los tokens son **exactamente los anteriores**.
4. Que **cambia Current / B / C** y los 6 roles valen lo medido en la Fase 2; en Light la estrategia **no cambia ningún token**.
5. Que el **DOM estructural permanece igual** tras 11 cambios de tema, esquema, estrategia y superficie.
6. Que **solo cambian los tokens esperados** (al cambiar de estrategia: los 6 roles derivados y sus alias `primary*`, `link`, `selection`, `active`, `focus` y `--g-calendar-now-color`).
7. Que la **superficie experimental** mueve `bg`, `surface` y `surface-sunken` (L 0.135 a 0.275) y que los valores coinciden con la Fase 2.
8. Que los **componentes reales reaccionan**: botón primario y de peligro, badge, switch encendido y casilla marcada leen el color del rol activo en A, B y C.
9. **Estados reales** (no se simula `strong`): `hover` (pasa a `primary-strong` y vuelve), `focus` (Tab real: anillo del token de foco), `checked` (casilla e interruptor), `disabled` (botón, campo y casilla) y `active` (`mouse.down`: `transform` de `:active`).
10. **Fuentes:** para cada tema, las dos familias se cargan de verdad (paquetes `@fontsource` instalados solo aquí) o el playground **registra el fallback** (`info-fallback`, etiqueta `fallback`); hay una prueba que bloquea la fuente de Inter para comprobarlo.

## Fuentes

Las fuentes de los temas (Inter, Source Sans 3, Source Serif 4, DM Sans, Instrument Sans, Instrument Serif) se instalan con `@fontsource` **solo en este laboratorio** (`devDependencies` de `design/lab/theme-playground`) y se copian a `fonts/` (ignorado por git) con `npm run setup`. En el entorno de pruebas las 11 configuraciones tienen sus dos fuentes disponibles. Si una no carga, la Theme Information Card lo dice y nombra el fallback usado (`--g-font-ui`).

## Límites (se conservan de la Fase 2)

- Las superficies low/medium/high **no** son tokens: son condiciones experimentales del laboratorio.
- No se define ningún límite superior (`max L`, `max ΔE`, reducción de croma ni fórmulas por tono); el playground sirve para **verlo**.
- El feedback semántico usa marcado propio con los tokens (Grana no tiene un componente «alert»).
- Los estados `active` se comprueban en el botón; no se prueba cada estado de cada componente.

## Observación: dónde empieza C a sobrecorregir (11 temas, sin definir ningún límite)

Herramientas: `npm run shots`-style con `node scripts/surface-sheet.mjs c` (con el servidor en :4180; hojas de contacto `screenshots/surfaces-c-1.png` a `-3.png`: los 11 temas × superficies low, real, medium y high, con Botones, Badges y Feedback de componentes reales) y `node scripts/c-onset.mjs` (barrido fino de `surface` L 0.10 a 0.32; resultados en `c-onset.md` y `c-onset.json`). **Solo medición.**

Hallazgos:

1. **El punto de inflexión es casi el mismo en los 11 temas y está muy cerca de la superficie real (L ≈ 0.226).** La luminosidad media de los 6 roles con C supera 0.74 a una superficie de **L 0.22 a 0.26** (mediana 0.26), el primer rol «nuevo» con L > 0.74 aparece en **0.24 a 0.26**, y el primer rol con croma conservado < 0.75 en **0.20 a 0.26** (Stripe ya en 0.20).
2. **Dos o más roles pastel** (croma < 0.75) aparecen a **0.26 a 0.29** en los 11 temas; a 0.30 hay 2 a 4 roles por tema (Linear, 4).
3. **La superficie real queda a solo 0.02 a 0.04 de L por debajo de ese punto.** Es decir, con la superficie tintada por defecto, C funciona, pero **con poco margen**: una superficie algo más clara (por ejemplo una personalizada) ya entra en la zona donde C eleva L por encima de 0.74.
4. **Con superficies bajas C se comporta como A** (L media 0.59 a 0.67, sin roles pastel): aquí no sobrecorrige.
5. **Visualmente** (hojas de contacto), de low a high: `danger` pasa de rojo anaranjado a salmón, las marcas rosas (Grana, Caracol Púrpura) tiran a rosa claro, las violetas (Stripe, Linear) a lavanda y `info` a celeste. No es catastrófico, pero el carácter del tono se diluye. **Spotify** ya tiene roles muy claros desde low (neón, menta): C no los cambia.
6. **Los 6 roles reaccionan juntos:** a `high`, C lleva los cuatro semánticos a L > 0.74 en los 11 temas, por lo que el efecto es sobre toda la paleta, no solo sobre `brand` y `accent`.

Esto **no define** `max L`, `max ΔE`, reducción de croma ni fórmulas por tono: indica **dónde** hay que mirar si se estudia una segunda restricción.

### A, B y C a lo largo de la superficie (`scripts/strategies-onset.mjs`, `strategies-onset.md`)

Mismo barrido para las tres hipótesis (66 observaciones por celda; recuerda que los 4 semánticos se repiten en los 11 temas). Indicadores de lectura, **no reglas**: «corto» = ΔE < 0.42, «claro» = L > 0.74, «pastel» = croma conservado < 0.75.

| Indicador | Estrategia | L 0.10 | L 0.15 | L 0.20 | real (0.226) | L 0.25 | L 0.30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| corto | A | 0 % | 0 % | 20 % | 36 % | 41 % | 70 % |
| corto | B | 0 % | 0 % | 0 % | 0 % | 0 % | 35 % |
| corto | C | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % |
| claro | C | 9 % | 9 % | 9 % | 9 % | 26 % | **100 %** |
| pastel | B | 5 % | 5 % | 5 % | 5 % | 5 % | 5 % |
| pastel | C | 0 % | 0 % | 2 % | 5 % | 6 % | **45 %** |

(A y B tienen 9 % «claro» en todas las superficies: son los colores que ya entraban luminosos, como el neón de Spotify. En «pastel», A llega solo a 3 % a L 0.30.)

1. **A se queda corta desde L 0.20** (20 % de las observaciones; 36 % con la superficie real; 70 % a 0.30). Confirma que depender solo del contraste falla, y falla **más** cuanto más clara es la superficie.
2. **B aguanta hasta L ≈ 0.25** (0 % cortos) y **se queda corta a 0.30** (35 %): el piso de L es constante, pero la presencia que da depende de la superficie.
3. **C nunca se queda corta** (0 % en todo el rango), pero **a 0.25 ya vuelve «claro» al 26 % y a 0.30 al 100 %, con 45 % pastel**: exagera.
4. **Hay una zona común de buen comportamiento de B y C: superficies de L ≈ 0.10 a 0.25**, que contiene la superficie real (0.226). **Fuera de ella fallan de formas opuestas:** B por defecto (no presencia suficiente) y C por exceso (aclara de más). Esto es lo que motiva estudiar una restricción compuesta con un límite superior, que **sigue sin definirse**.

## Fase 4 · huecos de evidencia

- `?set=gaps` carga los 5 temas de `../tema-oscuro/dark-color-presence-gaps/` (gris de luminosidad media, ocre y oliva, semánticos ajustados por colisión y superficies tintadas con el tono del acento). Las 5 pruebas nuevas de Playwright (36 en total) comprueban sus tokens, las estrategias y la superficie, que el DOM estructural es el mismo y que sus fuentes se cargan.
- `node scripts/gaps-sheet.mjs` genera `screenshots/gaps-sheet.png` (A, B y C con superficie real y alta).
- **Evaluación ciega** para una segunda persona: `node scripts/blind-sheet.mjs` genera `blind/` (39 imágenes al azar, plantilla CSV y clave) y `node scripts/score-blind.mjs ratings.csv` mide el acuerdo con la clasificación actual (ver `blind/README.md`). **Falta que una persona la rellene.**

## Fase 5 · experimento D (restricción compuesta, solo simulación)

`strategy=d` en el playground (y `D` en `results.json` y en `generated/*.variants.css`) simula **D = C + límite superior**: sube la base oscura hasta ΔE ≥ 0.50 (como C) **pero** sin pasar de L 0.74 y sin seguir aclarando si el croma conservado caería por debajo de 0.80. **Los dos límites son exploratorios**; no se adopta D ni se implementa en el Theme Engine.

- `node scripts/strategy-d.mjs` → `strategy-d.md`: A, B, C y tres variantes de D (solo tope, solo croma, ambos) sobre 16 temas (los 11 del benchmark y los 5 de la Fase 4) y superficies de L 0.10 a 0.32.
- `node scripts/strategy-d-grid.mjs` → `strategy-d-grid.md`: sensibilidad de D a sus parámetros (tope 0.72 a 1 y croma mínimo 0 a 0.85).
- `node scripts/d-sheet.mjs` → `screenshots/d-sheet.png`: A, B, C y D con superficie alta y real.

Resultados (16 temas × 6 roles por celda):

| Indicador | Estrategia | real | L 0.25 | L 0.30 | L 0.32 |
| --- | --- | --- | --- | --- | --- |
| corto (ΔE < 0.42) | A | 40 % | 44 % | 71 % | 73 % |
| corto | B | 0 % | 0 % | 40 % | 73 % |
| corto | C | 0 % | 0 % | 0 % | 0 % |
| corto | **D (ambos)** | 0 % | 0 % | 3 % | 8 % |
| claro (L > 0.74) | C | 7 % | 28 % | 100 % | 100 % |
| claro | **D (ambos)** | 7 % | 9 % | 8 % | 8 % |
| pastel (croma < 0.75) | C | 4 % | 5 % | 44 % | 46 % |
| pastel | **D (ambos)** | 0 % | 0 % | 3 % | 4 % |

- **D (ambos) es la única variante sin fallos grandes en todo el rango:** casi nunca se queda corta (≤ 3 % hasta L 0.30), no exagera la luminosidad (9 %, que son los colores que ya entraban luminosos) y casi no produce pasteles (≤ 4 %). Cuesta algo de distancia a superficie real (ΔE mínimo 0.458 en lugar de 0.50).
- **Cada límite cubre un caso distinto:** el tope de L frena a los colores de poco croma (grises, cremas: sin él, «claro» sigue en 76 % a 0.30); la condición de croma frena a los saturados (azules, violetas, rosas: sin ella, «pastel» sube a 5 % con el tope solo).
- **No depende de los valores exactos:** en la rejilla, con un tope de 0.74 a 0.78 y un croma mínimo de 0.75 a 0.85, el resultado casi no cambia (corto ≤ 4 % hasta 0.30, pastel ≤ 3 %). El croma mínimo **por encima de 0.75** es lo que mueve el pastel de 4 % a 0; el tope **a 0.76 o más sin croma** no contiene el efecto a 0.30 (24 % a 43 % pastel).
- **Visualmente** (`d-sheet.png`), con superficie alta D queda entre B y C: más presencia que A y B en los colores apagados (gris, ocre), pero conserva la saturación que C pierde (la marca de Grana no llega a salmón pálido; el violeta de Stripe no llega a lavanda). Con superficie real es casi igual que C.

Límites: 16 temas (los semánticos por defecto se repiten), indicadores numéricos de lectura (no reglas), una sola persona en la revisión visual, valores de D elegidos a priori y luego comprobados en una rejilla.
