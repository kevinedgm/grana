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
npm test                 # 31 pruebas (prepara las fuentes y arranca el servidor solo)
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
