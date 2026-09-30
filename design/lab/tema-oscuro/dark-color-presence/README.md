# Dark Color Presence · Fase 2 · Theme benchmark

**Estado:** investigación. **No** modifica el Theme Engine, el contrato de tokens, `primary`, la regla de niveles ni los semánticos. Esta carpeta es **evidencia y una recomendación para revisión**.

**Fase 1** (`../dark-presence/`, informe en `../investigacion-dark-color-presence.md`): 31 muestras aisladas × 9 familias cromáticas sobre una sola superficie (`#1C1C1C`). Sirve para entender el comportamiento matemático y perceptual de la derivación.
**Fase 2** (esta carpeta): 11 temas completos (10 de benchmark y Lustre como control), renderizados con componentes reales de `@grana/vue`, en Light y Dark, con las hipótesis A, B y C, y con tres condiciones de superficie oscura.

## Hipótesis

| | Qué es | Dónde se aplica |
| --- | --- | --- |
| **A** | Solo contraste ≥ 4.5:1 | Es lo que emite hoy el Theme Engine |
| **B** | Piso de luminosidad: la base oscura sube hasta L ≥ 0.70 | Simulación por fuera del motor |
| **C** | Distancia perceptual mínima a `surface`: ΔE (OKLab) ≥ 0.50 | Simulación por fuera del motor |

B y C se calculan llamando a la misma `deriveDarkColor` sobre un color claro ajustado (ver `packages/cli/scripts/dark-color-presence.mjs`). Ninguna es una regla adoptada: 0.70 y 0.50 son **valores experimentales**.

## Contenido

| Archivo | Qué contiene |
| --- | --- |
| `themes/*.json` | Las 11 configuraciones, **exactamente** las del documento de benchmark (solo `brand`, `accent`, `radius`, `shape`, `space`, `font`, `fontDisplay`, `fontSize`, `typeScale` y `dark`) |
| `generated/<tema>.css` · `.tokens.json` | `tokens.css` y `tokens.json` que el CLI actual genera para cada tema |
| `generated/<tema>.variants.css` | Variantes de simulación (A, B, C × superficie real, `low`, `medium`, `high`) que usa la página de benchmark |
| `benchmark.html` | La página **común** (mismo DOM para todos los temas) |
| `results.json` | Las mediciones objetivas: 66 muestras (11 × 6 roles), con A, B y C, y con las tres superficies experimentales |
| `visual.json` | La clasificación visual (`adequate`, `insufficient`, `excessive`, `pastel`), **separada** de las métricas |
| `matrix.md` | La comparación de los 11 temas |
| `screenshots/` | 56 capturas |
| `analysis.md` | Patrones, anomalías y fallos de las hipótesis |
| `recommendation.md` | La recomendación (no modifica nada) |

## Cómo reproducir

```bash
# 1. Generar temas, mediciones, variantes y matrix.md
node packages/cli/scripts/dark-color-presence.mjs design/lab/tema-oscuro/dark-color-presence

# 2. Servir el repositorio y abrir la página
python3 -m http.server 4175        # desde la raíz del repo
#   http://localhost:4175/design/lab/tema-oscuro/dark-color-presence/benchmark.html?t=grana&m=dark&v=A
```

Parámetros de `benchmark.html`: `t` = tema (`notion`, `apple`, `medium`, `stripe`, `caracol-purpura`, `amazon`, `github`, `spotify`, `linear`, `grana`, `lustre`) · `m` = `light` | `dark` · `v` = `A` | `B` | `C` · `s` = `actual` | `low` | `medium` | `high`. Requiere `npm run build` de `@grana/vue` (la página usa `dist/`).

Capturas: viewport de 920 × 740 px, el mismo contenido y los mismos componentes en todos los temas. Nombres: `<tema>-light-A.jpg`, `<tema>-dark-<A|B|C>.jpg` (superficie real) y `<tema>-dark-<A|B|C>-<low|high>.jpg` (superficies experimentales, solo `stripe` y `grana`).

## Condiciones experimentales de superficie oscura (no son tokens ni reglas)

La superficie real de los 11 temas es L ≈ 0.226 (`#1C1C1C` tintada con la marca). Se añaden tres condiciones, con el mismo tono y croma que la superficie del tema:

| Condición | `surface` L | `bg` L | `surface-sunken` L |
| --- | --- | --- | --- |
| `low` | 0.135 | 0.095 | 0.08 |
| `medium` | 0.20 | 0.16 | 0.13 |
| real | 0.226 | 0.187 | 0.15 |
| `high` | 0.275 | 0.235 | 0.205 |

## Qué se evaluó y cómo

- **Roles:** `brand`, `accent`, `success`, `warning`, `danger`, `info` (11 × 6 = 66 muestras).
- **Campos medidos** (en `results.json`): `theme`, `role`, `lightHex`, `lightOKLCH`, `darkHex`, `darkOKLCH`, `L`, `C`, `surfaceHex`, `surfaceL`, `deltaL`, `contrast`, `oklabDistance`, `visualResult`; además, para B y C y para cada superficie: lo mismo y el croma conservado.
- **Resultado visual:** el criterio único y las cuatro clases están en `analysis.md`. **Es un juicio del asistente** sobre las capturas, de una sola persona; no se mezcla con las métricas objetivas.
- **Validación:** `grana check` de los 11 temas (errores, avisos, colisiones, ajustes de gamut y de contraste) en `results.json` → `themes` y en `matrix.md`.

## Limitaciones (ver también `analysis.md`)

- Las fuentes de cada tema (Inter, Source Sans 3, DM Sans…) **no se cargan**: solo Instrument Sans viene con Grana; el resto cae a la pila del sistema. El benchmark mide color, no tipografía.
- Hover y active se muestran con los tokens `strong` (reposo, hover y foco en la fila «Estados»); **no** se forzaron estados `:hover` reales. El foco visible es el anillo del token de foco; no se probó con teclado real.
- Las cuatro muestras semánticas (`success`, `warning`, `danger`, `info`) **son las mismas en los 11 temas** (ninguno de los 11 temas las ajusta), así que aportan 4 observaciones independientes, no 44.
- Las superficies experimentales se revisaron **a ojo solo en `stripe` y `grana`**; en los demás hay cifras.
