# Arquetipos de material

Repertorio de materiales para el Paso 1 del Motor de Variación Creativa (Fase 2). Es un repertorio, no un menú cerrado: toma un arquetipo como punto de partida, deforma su física según la intención emocional del brief y renómbralo si deja de ser el mismo material. El mejor concepto suele ser un derivado que solo este producto tendría.

Cómo usarlo:

- Lee la física antes que el CSS. Si la física no encaja con el brief, el CSS tampoco.
- Los valores son de referencia; tradúcelos a custom properties del proyecto antes de usarlos en componentes.
- Cada par texto/fondo declarado aquí se calculó con la fórmula WCAG 2.x. Si cambias un color, el ratio deja de valer: vuelve a calcularlo contra cada fondo donde aparecerá.
- Los ratios están truncados a un decimal (nunca redondeados hacia arriba).
- El arquetipo viste la estructura aprobada; nunca cambia orden de lectura, orden de foco, estados ni adaptación.

## Reglas comunes a todos los arquetipos

- **Foco:** `:focus-visible` con `outline: 2px solid` y `outline-offset: 2px`. El color del anillo alcanza al menos 3:1 contra los colores adyacentes (el fondo de la página o de la card donde vive el control, visible en el hueco del offset).
- **Área táctil:** todo control interactivo tiene `min-height: 44px` y un ancho efectivo de al menos 44px.
- **Motion:** hover y active usan `cubic-bezier(0.16, 1, 0.3, 1)` (out) o `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring). Bajo `prefers-reduced-motion: reduce` se eliminan desplazamientos y escalas; se conservan los cambios de color y de estado.
- **Spacing:** solo valores de la secuencia 8, 13, 21, 34, 55, 89 (px).
- **Fuentes permitidas:** Space Grotesk, Bricolage Grotesque, Fraunces, Clash Display, PP Editorial New, Geist, JetBrains Mono. `system-ui` solo como último fallback.
- **Mezclas:** el texto nunca vive dentro de una capa con `mix-blend-mode`; la mezcla va en un pseudo-elemento sin contenido textual.
- **Translucidez:** un fondo `rgba()` se mide contra el color resultante más desfavorable (composición sobre el fondo real más claro u oscuro que pueda quedar detrás), no contra el valor declarado.
- **Blanco:** ningún fondo es `#FFFFFF`; los temas claros usan blanco roto.

Neutralización común de motion, aplicable a cualquier arquetipo:

```css
@media (prefers-reduced-motion: reduce) {
  .btn, .card, .field { transition: background-color 0s, border-color 0s, color 0s; }
  .btn:hover, .btn:active, .card:hover { transform: none; }
}
```

### 1. Obsidiana Serrada con Membrana Bioluminiscente
**Física visual:** negro volcánico con aristas de corte duro; una luz verde agua sangra desde el interior, como si algo vivo respirara bajo el vidrio. Suena a cristal vibrando en una cueva.
**Traducción CSS:** radius 2px; `border: 1px solid rgba(255,255,255,0.08)`; `box-shadow: inset 0 0 55px rgba(127,214,194,0.12)`; `backdrop-filter: blur(21px)`; gradiente de membrana `radial-gradient(circle at 50% 60%, rgba(127,214,194,0.18) 0%, rgba(127,214,194,0.06) 40%, transparent 70%)` en pseudo-elemento. Fuentes: Clash Display + Geist. Base: `#EDE9E1` sobre `#050505` = 16.8:1; card `rgba(255,255,255,0.035)` compuesta = `#0E0E0E`, texto 15.9:1, texto secundario `#A8A39A` 7.6:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 2px;
  background: #7FD6C2; color: #06110E; /* 11.2:1 */
  border: 1px solid rgba(255,255,255,0.08);
  font: 600 16px/1 "Geist", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 120ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #A3E6D6; box-shadow: 0 0 34px rgba(127,214,194,0.25); } /* 13.5:1 */
.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: 2px solid #C4F5E8; outline-offset: 2px; } /* 17.0:1 vs #050505 */
```
**Aplicación a card:**
```css
.card {
  position: relative; padding: 34px; border-radius: 2px;
  background: rgba(255,255,255,0.035); color: #EDE9E1; /* 15.9:1 sobre #0E0E0E */
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 0 55px rgba(127,214,194,0.12);
  backdrop-filter: blur(21px);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 2px;
  background: #0E0E10; color: #EDE9E1; /* 15.9:1 */
  border: 1px solid rgba(255,255,255,0.12);
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #9A968E; } /* 6.5:1; ejemplo de formato, la etiqueta es visible */
.field:focus-visible { outline: 2px solid #C4F5E8; outline-offset: 2px; border-color: #7FD6C2; }
```

### 2. Tantalio Cepillado con Vacío Controlado
**Física visual:** metal gris denso con estrías lineales finísimas; la luz resbala en una sola dirección y se apaga en los bordes. Espacios negativos enormes. Suena a silencio de cámara anecoica.
**Traducción CSS:** radius 0; hairlines `1px solid rgba(255,255,255,0.1)`; sin sombras proyectadas; textura `repeating-linear-gradient(90deg, #2A2A2A 0px, #303030 1px, #2C2C2C 2px, #2A2A2A 3px)`; padding de vacío 55–89px. Fuentes: Space Grotesk + JetBrains Mono para datos. Base: `#E8E6E1` sobre `#2A2A2A` = 11.5:1; peor estría `#303030` = 10.5:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 0;
  background: #D9D6CF; color: #161616; /* 12.4:1 */
  border: 1px solid rgba(255,255,255,0.1);
  font: 500 15px/1 "Space Grotesk", system-ui; letter-spacing: 0.08em; text-transform: uppercase;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #ECEAE4; } /* 15.0:1 */
.btn:active { background: #C9C6BE; }
.btn:focus-visible { outline: 2px solid #F2C14E; outline-offset: 2px; } /* 8.5:1 vs #2A2A2A */
```
**Aplicación a card:**
```css
.card {
  padding: 55px 89px 55px 55px; border-radius: 0;
  background: repeating-linear-gradient(90deg, #2A2A2A 0px, #303030 1px, #2C2C2C 2px, #2A2A2A 3px);
  color: #E8E6E1; /* 10.5:1 contra la estría más clara */
  border-top: 1px solid rgba(255,255,255,0.1);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 0; border-radius: 0;
  background: #1F1F1F; color: #E8E6E1; /* 13.2:1 */
  border: 0; border-bottom: 1px solid rgba(255,255,255,0.24);
  font: 400 16px/1.5 "JetBrains Mono", monospace;
}
.field::placeholder { color: #A3A09A; } /* 6.3:1 */
.field:focus-visible { outline: 2px solid #F2C14E; outline-offset: 2px; }
```

### 3. Viscosidad Neón sobre Cristal Ahumado
**Física visual:** láminas de vidrio ahumado apiladas sobre un charco de luz naranja que se mueve despacio; el color está contenido, nunca brilla hacia fuera. Suena a líquido espeso girando en un frasco.
**Traducción CSS:** radius 21px; glow `radial-gradient(circle at 30% 40%, rgba(255,107,53,0.3) 0%, rgba(255,107,53,0.12) 45%, transparent 70%)` con `mix-blend-mode: screen` en `::before` sin texto; vidrio `rgba(22,19,15,0.78)` + `backdrop-filter: blur(34px) saturate(1.2)`. Fuentes: Bricolage Grotesque + Geist. Base: `#F4EFE8` sobre `#0A0908` = 17.3:1; peor caso (vidrio sobre glow compuesto = `#241711`) 15.2:1; secundario `#C7BFB4` 9.5:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 21px;
  background: #FF7A45; color: #140A05; /* 7.5:1 */
  border: 0; font: 600 16px/1 "Bricolage Grotesque", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 160ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #FF9466; transform: translateY(-2px); } /* 9.0:1 */
.btn:active { transform: translateY(0) scale(0.97); }
.btn:focus-visible { outline: 2px solid #FFB38F; outline-offset: 2px; } /* 11.4:1 página; 7.2:1 sobre glow */
```
**Aplicación a card:**
```css
.card { position: relative; isolation: isolate; padding: 34px; border-radius: 21px; color: #F4EFE8; }
.card::before { /* capa mezclada, sin texto */
  content: ""; position: absolute; inset: -34px; z-index: -2; mix-blend-mode: screen;
  background: radial-gradient(circle at 30% 40%, rgba(255,107,53,0.3) 0%, rgba(255,107,53,0.12) 45%, transparent 70%);
}
.card::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
  background: rgba(22,19,15,0.78); backdrop-filter: blur(34px) saturate(1.2); border: 1px solid rgba(255,179,143,0.14); }
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 21px; border-radius: 13px;
  background: rgba(22,19,15,0.86); color: #F4EFE8; /* 15.5:1 sobre glow compuesto */
  border: 1px solid rgba(255,179,143,0.2);
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #B0A79B; } /* 7.4:1 */
.field:focus-visible { outline: 2px solid #FFB38F; outline-offset: 2px; }
```

### 4. Papel de Algodón con Tinta Ferrogálica
**Física visual:** papel grueso de fibra larga, mate, que absorbe la luz; la tinta de hierro se oxida de azul-negro a pardo con los años. Suena a plumilla rascando despacio.
**Traducción CSS:** radius 3px; sin `backdrop-filter`; sombra de hoja `0 1px 0 rgba(43,38,32,0.08), 0 13px 34px -21px rgba(43,38,32,0.25)`; fibra `linear-gradient(180deg, #F2EFE6 0%, #EFEBE1 50%, #F2EFE6 100%)`. Fuentes: Fraunces (óptica alta) + Geist. Base: `#2B2620` sobre `#F2EFE6` = 13.0:1; card `#EAE5D8` 11.9:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 3px;
  background: #2E3440; color: #F2EFE6; /* 10.8:1 */
  border: 1px solid #2E3440; font: 500 16px/1 "Geist", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #1F242D; } /* 13.5:1 */
.btn:active { background: #2B2620; }
.btn:focus-visible { outline: 2px solid #7A3F14; outline-offset: 2px; } /* 7.1:1 página; 6.5:1 card */
```
**Aplicación a card:**
```css
.card {
  padding: 34px 55px 34px 34px; border-radius: 3px;
  background: #EAE5D8; color: #2B2620; /* 11.9:1 */
  border-left: 1px solid rgba(122,63,20,0.35);
  box-shadow: 0 1px 0 rgba(43,38,32,0.08), 0 13px 34px -21px rgba(43,38,32,0.25);
  font: 400 17px/1.55 "Fraunces", serif;
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 3px;
  background: #F8F6EF; color: #2B2620; /* 13.8:1 */
  border: 1px solid #8C8274;
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #635C52; } /* 6.1:1 */
.field:focus-visible { outline: 2px solid #7A3F14; outline-offset: 2px; border-color: #2B2620; }
```

### 5. Cuarzo Ahumado con Vetas de Oro
**Física visual:** piedra translúcida marrón-humo con fracturas internas rellenas de oro; la luz entra, se enturbia y sale dorada por las grietas. Suena a una campana de piedra golpeada una vez.
**Traducción CSS:** radius 6px; vetas `linear-gradient(118deg, transparent 0%, transparent 46%, rgba(201,165,92,0.18) 48%, transparent 51%, transparent 100%)`; cuerpo `linear-gradient(160deg, #24211E 0%, #2B2723 55%, #1F1C19 100%)`; `box-shadow: inset 0 1px 0 rgba(232,199,127,0.12), 0 21px 55px -34px rgba(0,0,0,0.8)`. Fuentes: PP Editorial New + Geist. Base: `#EFE8DC` sobre `#1C1A18` = 14.2:1; peor stop de card `#2B2723` 12.1:1; sobre veta compuesta 8.6:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 6px;
  background: linear-gradient(180deg, #D4B26A 0%, #C9A55C 50%, #C09A50 100%); color: #1A1612; /* 7.7:1 contra #C9A55C; peor stop #C09A50 también > 6.5 */
  border: 1px solid rgba(232,199,127,0.4); font: 600 16px/1 "Geist", system-ui;
  transition: filter 200ms cubic-bezier(0.16,1,0.3,1), transform 140ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #DDBB72; } /* 9.7:1 */
.btn:active { transform: scale(0.98); }
.btn:focus-visible { outline: 2px solid #E8C77F; outline-offset: 2px; } /* 10.6:1 vs #1C1A18 */
```
**Aplicación a card:**
```css
.card {
  padding: 34px; border-radius: 6px; color: #EFE8DC; /* 12.1:1 peor stop */
  background:
    linear-gradient(118deg, transparent 0%, transparent 46%, rgba(201,165,92,0.18) 48%, transparent 51%, transparent 100%),
    linear-gradient(160deg, #24211E 0%, #2B2723 55%, #1F1C19 100%);
  box-shadow: inset 0 1px 0 rgba(232,199,127,0.12), 0 21px 55px -34px rgba(0,0,0,0.8);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 21px; border-radius: 6px;
  background: #151311; color: #EFE8DC; /* 15.2:1 */
  border: 1px solid rgba(201,165,92,0.3);
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #A39A8C; } /* 6.6:1 */
.field:focus-visible { outline: 2px solid #E8C77F; outline-offset: 2px; }
```

### 6. Membrana Bioluminiscente sobre Grafito
**Física visual:** lámina orgánica verde que late sobre una superficie de lápiz mate; la luz es fría, aparece en pulsos y se concentra en los bordes activos. Suena a un zumbido grave intermitente.
**Traducción CSS:** radius 13px; `box-shadow: inset 0 0 0 1px rgba(61,220,151,0.18), inset 0 0 34px rgba(61,220,151,0.08)`; membrana `radial-gradient(ellipse at 0% 100%, rgba(61,220,151,0.14) 0%, rgba(61,220,151,0.05) 40%, transparent 75%)`. Fuentes: Space Grotesk + JetBrains Mono. Base: `#E4E7E5` sobre `#1E2022` = 13.1:1; card con tinte verde compuesto (`#273634`) 10.1:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 13px;
  background: #3DDC97; color: #0B1A13; /* 10.1:1 */
  border: 0; font: 600 16px/1 "Space Grotesk", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 320ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #6BE8B2; box-shadow: 0 0 0 8px rgba(61,220,151,0.12); } /* 11.7:1 */
.btn:active { transform: scale(0.97); transition-timing-function: cubic-bezier(0.34,1.56,0.64,1); }
.btn:focus-visible { outline: 2px solid #8CF0C2; outline-offset: 2px; } /* 11.9:1 vs #1E2022 */
```
**Aplicación a card:**
```css
.card {
  padding: 34px 21px; border-radius: 13px; color: #E4E7E5; /* 10.1:1 sobre el tinte más denso */
  background: radial-gradient(ellipse at 0% 100%, rgba(61,220,151,0.08) 0%, rgba(61,220,151,0.04) 40%, transparent 75%), #25282B;
  box-shadow: inset 0 0 0 1px rgba(61,220,151,0.18), inset 0 0 34px rgba(61,220,151,0.08);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 8px;
  background: #17191B; color: #E4E7E5; /* 14.1:1 */
  border: 1px solid rgba(228,231,229,0.18);
  font: 400 16px/1.5 "JetBrains Mono", monospace;
}
.field::placeholder { color: #979D9A; } /* 6.3:1 */
.field:focus-visible { outline: 2px solid #8CF0C2; outline-offset: 2px; border-color: #3DDC97; }
```

### 7. Cerámica Craquelada con Esmalte Profundo
**Física visual:** bizcocho claro con un esmalte azul-cobalto espeso que se ha cuarteado al enfriar; la luz se acumula en el vidriado y se rompe en la red de grietas. Suena a una taza que se enfría con chasquidos diminutos.
**Traducción CSS:** radius asimétrico `34px 8px 34px 8px`; esmalte `linear-gradient(145deg, #2A4B61 0%, #1F3A4D 50%, #183041 100%)`; craquelado SVG inline como `background-image` con trazo `rgba(242,238,228,0.07)` en capa sin texto; `box-shadow: inset 0 2px 0 rgba(255,255,255,0.08), 0 13px 34px -13px rgba(31,58,77,0.45)`. Fuentes: Fraunces + Bricolage Grotesque. Base: `#23211D` sobre `#EFEAE0` = 13.4:1; texto sobre esmalte `#F2EEE4`/`#2A4B61` (stop más claro) 7.9:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 21px 8px 21px 8px;
  background: #1F3A4D; color: #F2EEE4; /* 10.2:1 */
  border: 0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.1);
  font: 600 16px/1 "Bricolage Grotesque", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 140ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #16303F; } /* 11.8:1 */
.btn:active { transform: translateY(1px); }
.btn:focus-visible { outline: 2px solid #1F3A4D; outline-offset: 2px; } /* 9.8:1 vs #EFEAE0 */
```
**Aplicación a card:**
```css
.card {
  padding: 34px 55px; border-radius: 34px 8px 34px 8px; color: #F2EEE4; /* 7.9:1 peor stop */
  background: linear-gradient(145deg, #2A4B61 0%, #1F3A4D 50%, #183041 100%);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.08), 0 13px 34px -13px rgba(31,58,77,0.45);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 21px; border-radius: 8px;
  background: #F7F4EC; color: #23211D; /* 14.6:1 */
  border: 1px solid #8A8478;
  font: 400 16px/1.5 "Bricolage Grotesque", system-ui;
}
.field::placeholder { color: #67625A; } /* 5.5:1 */
.field:focus-visible { outline: 2px solid #1F3A4D; outline-offset: 2px; }
```

### 8. Vidrio Esmerilado con Luz Difusa
**Física visual:** lámina de vidrio lijado delante de una ventana nublada; no hay sombras duras, solo una claridad uniforme y fría que borra los contornos del fondo. Suena a lluvia lejana tras una puerta.
**Traducción CSS:** radius 13px; página `linear-gradient(170deg, #E8ECEF 0%, #DDE4EA 50%, #EEF0EE 100%)`; vidrio `rgba(246,247,245,0.55)` + `backdrop-filter: blur(34px)`; `border: 1px solid rgba(29,38,48,0.08)`; sombra `0 21px 55px -34px rgba(29,38,48,0.3)`. Fuentes: Geist + JetBrains Mono. Base: `#1D2630` sobre stop más oscuro `#DDE4EA` = 11.9:1; card compuesta (`#EBEEF0`) 13.1:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 13px;
  background: #24384A; color: #F1F4F6; /* 10.9:1 */
  border: 0; font: 500 16px/1 "Geist", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 200ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #1A2B3A; transform: translateY(-1px); } /* 13.1:1 */
.btn:active { transform: translateY(0); }
.btn:focus-visible { outline: 2px solid #24384A; outline-offset: 2px; } /* 9.4:1 vs #DDE4EA */
```
**Aplicación a card:**
```css
.card {
  padding: 34px; border-radius: 13px; color: #1D2630; /* 13.1:1 compuesto */
  background: rgba(246,247,245,0.55); backdrop-filter: blur(34px);
  border: 1px solid rgba(29,38,48,0.08);
  box-shadow: 0 21px 55px -34px rgba(29,38,48,0.3);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 8px;
  background: rgba(246,247,245,0.7); color: #1D2630; /* 13.5:1 compuesto */
  border: 1px solid rgba(29,38,48,0.35);
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #4F5A65; } /* 6.2:1 */
.field:focus-visible { outline: 2px solid #24384A; outline-offset: 2px; }
```

### 9. Metal Cepillado con Óxido Controlado
**Física visual:** chapa de aluminio pálido con un cepillado horizontal y manchas de óxido aplicadas a propósito solo donde hay acción. La luz se estira en franjas. Suena a una lima pasando una vez por el borde.
**Traducción CSS:** radius 2px; cepillado `repeating-linear-gradient(0deg, #D4D6D6 0px, #CDD0D1 1px, #D6D8D8 2px, #C8CBCC 3px)`; óxido `#8E3B1C` reservado a acciones; `box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(30,33,36,0.12)`. Fuentes: Space Grotesk + JetBrains Mono. Base: `#1E2124` sobre `#D4D6D6` = 11.0:1; peor franja `#C8CBCC` 9.9:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 2px;
  background: #8E3B1C; color: #F5F1EA; /* 6.6:1 */
  border: 1px solid #7A3015; font: 600 15px/1 "Space Grotesk", system-ui; letter-spacing: 0.04em;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #7A3015; } /* 8.2:1 */
.btn:active { box-shadow: inset 0 2px 8px rgba(0,0,0,0.3); }
.btn:focus-visible { outline: 2px solid #8E3B1C; outline-offset: 2px; } /* 5.1:1 página; 4.6:1 franja más oscura */
```
**Aplicación a card:**
```css
.card {
  padding: 21px 34px; border-radius: 2px; color: #1E2124; /* 9.9:1 peor franja */
  background: repeating-linear-gradient(0deg, #D4D6D6 0px, #CDD0D1 1px, #D6D8D8 2px, #C8CBCC 3px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(30,33,36,0.12);
  border-left: 3px solid #8E3B1C;
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 2px;
  background: #E6E7E6; color: #1E2124; /* 13.0:1 */
  border: 1px solid #6E7378; box-shadow: inset 0 1px 2px rgba(30,33,36,0.12);
  font: 400 16px/1.5 "JetBrains Mono", monospace;
}
.field::placeholder { color: #50555A; } /* 6.0:1 */
.field:focus-visible { outline: 2px solid #8E3B1C; outline-offset: 2px; }
```

### 10. Tinta Diluida sobre Papel Secante
**Física visual:** aguadas de tinta gris-azulada que se expanden en papel poroso y dejan bordes irregulares más oscuros que el centro. La luz es plana; el interés está en la mancha. Suena a una gota cayendo en agua quieta.
**Traducción CSS:** radius 3px; aguada `radial-gradient(ellipse at 20% 30%, rgba(62,85,102,0.12) 0%, rgba(62,85,102,0.06) 45%, rgba(62,85,102,0) 80%)`; borde de capilaridad `box-shadow: inset 0 0 0 1px rgba(62,85,102,0.14), inset 0 0 21px rgba(62,85,102,0.06)`. Fuentes: PP Editorial New + Geist. Base: `#22272B` sobre `#F3F1EA` = 13.3:1; peor aguada compuesta (`#DDDEDA`) 11.1:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 3px;
  background: #2F3B45; color: #F3F1EA; /* 10.1:1 */
  border: 0; font: 500 16px/1 "Geist", system-ui;
  transition: background-color 320ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #3D4C58; } /* 7.8:1; la tinta se diluye al pasar */
.btn:active { background: #22272B; }
.btn:focus-visible { outline: 2px solid #3E5566; outline-offset: 2px; } /* 6.8:1 vs #F3F1EA */
```
**Aplicación a card:**
```css
.card {
  padding: 34px 21px 55px; border-radius: 3px; color: #22272B; /* 11.1:1 peor aguada */
  background: radial-gradient(ellipse at 20% 30%, rgba(62,85,102,0.12) 0%, rgba(62,85,102,0.06) 45%, rgba(62,85,102,0) 80%), #F3F1EA;
  box-shadow: inset 0 0 0 1px rgba(62,85,102,0.14), inset 0 0 21px rgba(62,85,102,0.06);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 3px;
  background: #F9F7F1; color: #22272B; /* 14.0:1 */
  border: 0; border-bottom: 2px solid #3E5566;
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #5F656A; } /* 5.5:1 */
.field:focus-visible { outline: 2px solid #3E5566; outline-offset: 2px; }
```

### 11. Ámbar Translúcido con Inclusiones
**Física visual:** resina fósil color miel que retiene la luz y la devuelve cálida desde dentro; pequeñas inclusiones oscuras flotan suspendidas a distintas profundidades. Suena a madera crujiendo al sol.
**Traducción CSS:** radius 21px 21px 8px 8px; cuerpo `rgba(214,139,38,0.14)` sobre `#1A1008`; inclusiones `radial-gradient(circle at 72% 28%, rgba(214,139,38,0.12) 0%, rgba(214,139,38,0.05) 21%, transparent 34%)` apiladas sobre el cuerpo; `box-shadow: inset 0 1px 0 rgba(245,199,122,0.2), inset 0 -21px 34px -21px rgba(0,0,0,0.5)`. Fuentes: Fraunces + Geist. Base: `#F6E7CF` sobre `#1A1008` = 15.3:1; card compuesta 12.6:1; sobre inclusión compuesta 10.3:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 21px;
  background: #E3A13B; color: #1A1008; /* 8.4:1 */
  border: 1px solid rgba(245,199,122,0.5); font: 600 16px/1 "Geist", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 160ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #EDB45C; transform: translateY(-2px); } /* 10.0:1 */
.btn:active { transform: translateY(0) scale(0.97); }
.btn:focus-visible { outline: 2px solid #F5C77A; outline-offset: 2px; } /* 11.8:1 vs #1A1008 */
```
**Aplicación a card:**
```css
.card {
  padding: 34px; border-radius: 21px 21px 8px 8px; color: #F6E7CF; /* 10.3:1 peor zona compuesta */
  background: radial-gradient(circle at 72% 28%, rgba(214,139,38,0.12) 0%, rgba(214,139,38,0.05) 21%, transparent 34%), rgba(214,139,38,0.14);
  box-shadow: inset 0 1px 0 rgba(245,199,122,0.2), inset 0 -21px 34px -21px rgba(0,0,0,0.5);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 21px; border-radius: 13px;
  background: #24170C; color: #F6E7CF; /* 14.3:1 */
  border: 1px solid rgba(227,161,59,0.35);
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #BFA584; } /* 7.4:1 */
.field:focus-visible { outline: 2px solid #F5C77A; outline-offset: 2px; }
```

### 12. Grafito Pulido con Micro-rayaduras
**Física visual:** mina de lápiz pulida hasta casi espejo, monocroma; al moverse, la luz revela miles de rayas microscópicas en un ángulo. Sin color de acento: la jerarquía es solo luminancia. Suena a un trazo seco sobre pizarra.
**Traducción CSS:** radius 6px; rayas `repeating-linear-gradient(135deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0) 3px)`; reflejo `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 40%, rgba(255,255,255,0) 100%)`; `border: 1px solid rgba(255,255,255,0.06)`. Fuentes: Geist + JetBrains Mono. Base: `#D9D9D6` sobre `#0A0A0A` = 13.9:1; card `#161616` 12.7:1, peor zona con reflejo y rayas compuestos (`#272727`) 10.5:1; secundario `#9A9A96` 5.0:1 en ese peor caso.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 6px;
  background: #D9D9D6; color: #0A0A0A; /* 13.9:1 */
  border: 0; font: 500 16px/1 "Geist", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 120ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #ECECE8; } /* 16.7:1 */
.btn:active { transform: scale(0.98); }
.btn:focus-visible { outline: 2px solid #F0F0EC; outline-offset: 2px; } /* 17.3:1 página; 13.0:1 card peor zona */
```
**Aplicación a card:**
```css
.card {
  padding: 21px 34px; border-radius: 6px; color: #D9D9D6; /* 10.5:1 peor zona compuesta */
  background:
    repeating-linear-gradient(135deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0) 3px),
    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 40%, rgba(255,255,255,0) 100%), #161616;
  border: 1px solid rgba(255,255,255,0.06);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 6px;
  background: #111111; color: #D9D9D6; /* 13.3:1 */
  border: 1px solid rgba(255,255,255,0.14);
  font: 400 16px/1.5 "JetBrains Mono", monospace;
}
.field::placeholder { color: #8C8C88; } /* 5.5:1 */
.field:focus-visible { outline: 2px solid #F0F0EC; outline-offset: 2px; }
```

### 13. Seda Tensada sobre Marco de Madera
**Física visual:** tela fina y clara estirada sobre un bastidor de nogal; la luz atraviesa la seda con un brillo lateral suave y el marco la contiene con peso. Suena a un tambor de piel rozado con la palma.
**Traducción CSS:** radius 0 en el marco, 3px en la tela; marco `border: 8px solid #6B4426`; brillo de seda `linear-gradient(100deg, #F7F3EA 0%, #FAF7F0 35%, #F4EFE4 70%, #F7F3EA 100%)`; `box-shadow: inset 0 0 0 1px rgba(107,68,38,0.2), 0 13px 34px -21px rgba(42,32,24,0.4)`. Fuentes: PP Editorial New + Bricolage Grotesque. Base: `#2A2018` sobre `#F2EFE6` = 13.8:1; card `#F7F3EA` 14.3:1 (el stop más oscuro `#F4EFE4` sigue por encima de 13).
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 3px;
  background: #6B4426; color: #F7F3EA; /* 7.6:1 */
  border: 0; font: 500 16px/1 "Bricolage Grotesque", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 160ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #56351C; } /* 9.8:1 */
.btn:active { transform: translateY(1px); }
.btn:focus-visible { outline: 2px solid #6B4426; outline-offset: 2px; } /* 7.3:1 vs #F2EFE6 */
```
**Aplicación a card:**
```css
.card {
  padding: 34px 55px; border-radius: 0; color: #2A2018; /* 14.3:1 */
  border: 8px solid #6B4426;
  background: linear-gradient(100deg, #F7F3EA 0%, #FAF7F0 35%, #F4EFE4 70%, #F7F3EA 100%);
  box-shadow: inset 0 0 0 1px rgba(107,68,38,0.2), 0 13px 34px -21px rgba(42,32,24,0.4);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 21px; border-radius: 3px;
  background: #FBF8F1; color: #2A2018; /* 15.0:1 */
  border: 1px solid #8E7864;
  font: 400 16px/1.5 "Bricolage Grotesque", system-ui;
}
.field::placeholder { color: #6A5D50; } /* 6.0:1 */
.field:focus-visible { outline: 2px solid #6B4426; outline-offset: 2px; }
```

### 14. Hormigón Brutalista con Juntas Expuestas
**Física visual:** paneles de concreto colado, gris cálido, con juntas negras visibles y la huella del encofrado. Plano, sin sombras ni brillos: la luz es cenital y dura. Suena a una puerta pesada cerrándose.
**Traducción CSS:** radius 0 siempre; juntas `border: 2px solid #141414`; sin `box-shadow` difusa, solo desplazada `8px 8px 0 #141414`; textura de encofrado `repeating-linear-gradient(90deg, #CFCCC6 0px, #CFCCC6 89px, #C9C6C0 89px, #C9C6C0 90px, #CFCCC6 90px)`. Fuentes: Clash Display + JetBrains Mono. Base: `#141414` sobre `#CFCCC6` = 11.4:1; card `#C4C1BA` 10.2:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 21px; border-radius: 0;
  background: #141414; color: #E9E6DF; /* 14.7:1 */
  border: 2px solid #141414; font: 600 16px/1 "Clash Display", system-ui; text-transform: uppercase;
  transition: transform 120ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 120ms cubic-bezier(0.34,1.56,0.64,1);
}
.btn:hover { background: #2B2B2B; box-shadow: 8px 8px 0 #6E6A63; transform: translate(-2px, -2px); } /* 11.3:1 */
.btn:active { box-shadow: none; transform: translate(0, 0); }
.btn:focus-visible { outline: 2px solid #141414; outline-offset: 2px; } /* 11.4:1 página; 10.2:1 card */
```
**Aplicación a card:**
```css
.card {
  padding: 34px; border-radius: 0; color: #141414; /* 10.2:1 */
  background: #C4C1BA;
  border: 2px solid #141414;
  box-shadow: 8px 8px 0 #141414;
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px; border-radius: 0;
  background: #E2DFD8; color: #141414; /* 13.8:1 */
  border: 2px solid #141414;
  font: 400 16px/1.5 "JetBrains Mono", monospace;
}
.field::placeholder { color: #4A4845; } /* 6.8:1 */
.field:focus-visible { outline: 2px solid #141414; outline-offset: 2px; }
```

### 15. Nieve Compactada con Huellas
**Física visual:** superficie blanca-azulada, mate y silenciosa, donde cada interacción deja una depresión suave; las sombras son azules, nunca grises. Suena a pasos amortiguados.
**Traducción CSS:** radius 21px; huella `box-shadow: inset 0 2px 8px rgba(44,74,99,0.12), inset 0 -1px 0 rgba(255,255,255,0.6)`; relieve `0 13px 34px -21px rgba(44,74,99,0.3)`; deriva `linear-gradient(180deg, #F6F8F8 0%, #EEF2F3 60%, #E3E8EA 100%)`. Fuentes: Bricolage Grotesque + Geist. Base: `#1B2733` sobre `#EEF1F2` = 13.3:1; card `#F6F8F8` 14.2:1; stop más oscuro `#E3E8EA` 12.2:1.
**Aplicación a button:**
```css
.btn {
  min-height: 44px; padding: 13px 34px; border-radius: 21px;
  background: #2C4A63; color: #F6F8F8; /* 8.6:1 */
  border: 0; box-shadow: 0 8px 21px -13px rgba(44,74,99,0.6);
  font: 600 16px/1 "Bricolage Grotesque", system-ui;
  transition: background-color 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms cubic-bezier(0.16,1,0.3,1);
}
.btn:hover { background: #223B50; } /* 10.8:1 */
.btn:active { box-shadow: inset 0 2px 8px rgba(0,0,0,0.25); } /* la huella se hunde */
.btn:focus-visible { outline: 2px solid #2C4A63; outline-offset: 2px; } /* 8.1:1 vs #EEF1F2 */
```
**Aplicación a card:**
```css
.card {
  padding: 34px 21px; border-radius: 21px; color: #1B2733; /* 12.2:1 peor stop */
  background: linear-gradient(180deg, #F6F8F8 0%, #EEF2F3 60%, #E3E8EA 100%);
  box-shadow: 0 13px 34px -21px rgba(44,74,99,0.3), inset 0 -1px 0 rgba(255,255,255,0.6);
}
```
**Aplicación a input:**
```css
.field {
  min-height: 44px; padding: 13px 21px; border-radius: 13px;
  background: #F8FAFA; color: #1B2733; /* 14.4:1 */
  border: 1px solid #8A99A6; box-shadow: inset 0 2px 8px rgba(44,74,99,0.12);
  font: 400 16px/1.5 "Geist", system-ui;
}
.field::placeholder { color: #586673; } /* 5.6:1 */
.field:focus-visible { outline: 2px solid #2C4A63; outline-offset: 2px; }
```

## Cómo crear un arquetipo nuevo

1. **Nombre = material + condición.** Un sustantivo físico y un estado que lo altera («Cobre Patinado por Lluvia Ácida», «Lino Mojado al Contraluz»). Si el nombre no evoca una textura concreta, aún no es un material.
2. **Física.** Describe en dos o tres líneas cómo se ve, cómo se comporta la luz (absorbe, refracta, se acumula, se rompe) y cómo sonaría. Debe distinguirse de los otros dos conceptos de la ronda.
3. **Traducción.** Deriva cada propiedad de la física: radius, bordes, sombras, filtros, gradientes de 3+ stops, opacidades y pareja tipográfica de la lista permitida. Lo que no se justifica desde el material, la estructura o la accesibilidad, sobra.
4. **Contraste.** Calcula cada par texto/fondo (4.5:1) y cada anillo de foco (3:1) con la fórmula WCAG; compón los fondos translúcidos sobre el peor caso y comprueba el stop más desfavorable de cada gradiente. Trunca, no redondees.
5. **Registro.** Anota el arquetipo en la direction card: concepto, por qué este, primitivos en HSL u OKLCH, pares con ratio, motion y versión reducida, y cualquier excepción del proyecto con su fuente.
