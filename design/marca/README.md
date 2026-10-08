# Marca de Grana

Identidad aprobada por el usuario el 2026-10-08 (DECISIONS #544). Guía visual completa en `guia-marca.html`: ábrela en el navegador.

**Tesis:** estructura fija, color tuyo. El símbolo es la grana cochinilla en dos capas:
- **El armazón**, en tinta, fijo. Usa `currentColor`.
- **El tinte**, detrás y fuera de registro, que lo pone el tema. Lee `--g-color-brand`; por defecto, carmín.

## Piezas

| Pieza | Archivos | Regla |
|---|---|---|
| Símbolo | `svg/grana-simbolo.svg` | De 24 px en adelante |
| Símbolo de 16 px | `svg/grana-simbolo-16.svg` | Una banda, sin antenas; favicon y menos de 24 px |
| Una tinta | `svg/grana-simbolo-tinta.svg`, `svg/grana-simbolo-16-tinta.svg` | El tinte pasa a ser un segundo contorno desplazado |
| Nombre W1 | `svg/grana-w1.svg` | Interfaz: menos de 48 px de alto |
| Nombre W2 | `svg/grana-w2.svg` | Exhibición: portada, README, tarjetas. El nombre también se sale de registro |
| Movimiento «la impresión» | `svg/grana-simbolo-animado.svg`, `svg/grana-w2-animado.svg` | Se traza el armazón, el tinte aparece alineado y se desliza fuera de registro (~1.1 s y ~1.4 s). Una vez, nunca en bucle; con `prefers-reduced-motion`, estado final |
| Favicon e iconos de app | `svg/favicon.svg`, `png/favicon.ico`, `png/favicon-{16,32,48}.png`, `png/apple-touch-icon.png`, `png/icon-*.png` | El favicon cambia con el tema del navegador |
| Avatar | `svg/avatar-{claro,oscuro}.svg`, `png/avatar-*-{460,512,1024}.png` | GitHub y npm |
| Cabecera del README | `svg/readme-cabecera-{claro,oscuro}.svg` | `<picture>` con `prefers-color-scheme` |
| Tarjeta para redes | `svg/tarjeta-redes-*.svg`, `png/tarjeta-redes-*-1280x640.png` | GitHub → Settings → Social preview (se sube a mano) |

El texto de todos los SVG está convertido a trazados (Instrument Sans), así que no depende de la fuente instalada.

## Color de la marca

`grana-marca.css` y `paleta.json`. Es la paleta propia de Grana: docs, README y valor por defecto del logo. **No es el tema por defecto de `@grana/vue`.**

| | Claro | Oscuro | Uso |
|---|---|---|---|
| Carmín | `#a3123a` · 6.97:1 | `#d74b63` · 4.55:1 | Principal. En pantallas P3, `color(display-p3 .62 .05 .2)` |
| Nopal | `#2f6a3d` · 5.80:1 | `#4e895a` · 4.53:1 | Acento escaso |
| Cera | `#f7f2ea` | `#151012` | Fondo |
| Tinta | `#1d1517` · 16.08:1 | `#efe7dd` · 15.38:1 | Texto y armazón |

Contraste medido sobre cera, con los mínimos de Grana (texto 4.5:1).
- En oscuro, el carmín sube de luz con el mismo tono y croma en OKLCH. Un botón carmín lleva texto oscuro.
- Nunca distingas dos estados solo con carmín frente a nopal: con deuteranopía se confunden.

## No

- Cambiar la forma o el número de bandas del símbolo.
- Alinear el tinte con el armazón o moverlo a otro lado.
- Fijar el lema al logotipo. Va como texto aparte: por debajo de 48 px de alto no se lee.

Verificado en Chromium. Firefox y WebKit, sin probar (el movimiento usa la propiedad CSS `translate`).
