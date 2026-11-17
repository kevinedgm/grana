# Tema GEMA · laboratorio

Tema de **GEMA** (Gestión de Muestras y Análisis, sistema del laboratorio Nisa Nabani) sobre Grana, con una vista de ejemplo. Es un ejemplo de aplicación: **no cambia el tema por defecto de Grana** ni ningún componente.

- **Marca** (congelada fuera de este repo, en Fruti Squad `.fruti/icons/gema/`): símbolo «Pantalla + Resultado», degradado navy `#052A76 → #3D67AE` solo en superficies de marca, letra Onest.
- **Dirección visual elegida (usuario, 2026-11-17): A + B.** De A («Bata de laboratorio»): fondo papel, líneas finas, aire, el navy solo en la acción principal. De B («Instrumento»): barra lateral y tablas compactas.

## Archivos
| Archivo | Qué es |
| --- | --- |
| `grana.config.json` | Entrada del tema para `@grana/cli`: `brand #052A76`, `font Onest`, `radius 6`, `space 4`, neutros puros con papel (`--g-color-bg #f7f7f4`) y oscuro con `brand #3D67AE` |
| `tema-gema.css` | Generado: `node packages/cli/bin/grana.mjs theme design/lab/temas/gema/grana.config.json --out design/lab/temas/gema/tema-gema.css` (desde la raíz). No editar a mano |
| `vista-registrar-orden.html` | Vista de ejemplo «Registrar orden» con componentes reales de `dist/` |
| `vista-claro.png`, `vista-oscuro.png`, `vista-movil.png` | Capturas de la vista |

## Ver la vista
`npm run build -w @grana/vue`, luego desde la raíz `python3 -m http.server 4212` y abre `http://localhost:4212/design/lab/temas/gema/vista-registrar-orden.html` (`?dark=1` para el oscuro). Onest se carga de Google Fonts (Grana solo trae Instrument Sans).

## La vista
`GAppShell` + `GSidebar` (grupos como el sistema real, `density="compact"`, destinos principales para el navbar móvil) + `GPageHeader` + `GForm` con cuatro `GFormSection` (con `divider`): cliente y entrega (`GCombobox` × 2, `GRadioGroup inline`), muestras (`GTable density="compact"`; «Agregar muestra» se habilita al elegir cliente y aplica su descuento), pago (`GSelect` y total en mono), confirmación (firma y `GCheckbox`), y `GFormActions`. La **firma es de la aplicación** (Grana no trae campo de firma): un lienzo con tokens. Datos ficticios.

## Cumplimientos
- `grana check`: el tema cumple los mínimos (96 tokens, 0 avisos). Antes rechazó dos combinaciones (texto sutil y borde de control sobre `surface-sunken`) y un `info` demasiado cercano a la marca en oscuro: corregidos (`surface-sunken #f2f2ee`, `info #0b6e8a` / `#38bdf8`).
- La vista monta sin errores ni avisos de consola en claro, oscuro y móvil (390 px, sin desborde horizontal). Flujo probado: elegir cliente → agregar muestras con descuento (1,450 × 0.9 = 1,305; 2,170 × 0.9 = 1,953; total 3,258) → enviar sin factura muestra «Indica si requiere factura».
- Solo tokens `--g-*` en el andamio de la aplicación.

## Correcciones
- En oscuro, el CLI ajustó la marca a `#547FC8` (no `#3D67AE`) para cumplir contraste: se respeta lo generado.
- El navbar móvil mostraba la píldora sin contenido porque el destino actual no estaba entre los visibles: se marcaron destinos `primary`.

## Pendientes
- Auditoría visual previa y posterior de `docs/documentacion/auditoria-visual.md` hecha de forma resumida aquí; falta la de coco si el tema se promueve.
- No verificado: lector de pantalla, táctil real, Safari, zoom 200 %.
- La firma con teclado no tiene alternativa (solo se puede borrar): si se usa en producción, necesita una alternativa accesible (por ejemplo, escribir el nombre).
- `categories: 4` usa tonos generados por el CLI (incluye un violeta); no se usan en esta vista.
