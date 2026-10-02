# Temas de demostración

> **Estado:** `pre-alpha` · **Validación de publicación:** `pendiente`

Estas configuraciones muestran dos identidades distintas construidas con las mismas APIs de Grana. No cambian el CSS de los componentes.

| Tema | Intención | Rasgos |
| --- | --- | --- |
| Editorial cálido | Producto con voz cultural, creativa o premium. | Magenta, añil, neutros teñidos y tipografía de display. |
| Utilitario frío | Dashboard, SaaS o herramienta operativa. | Azul, verde, radios más contenidos y neutros puros. |

## Generar un tema

```bash
npx @grana/cli theme examples/themes/editorial-warm.grana.json --out src/styles/grana.css
```

Cambia el nombre de archivo para generar el segundo tema.

## Estado de estas configuraciones

El CLI debe validar cada archivo en claro y oscuro antes de usarse como ejemplo oficial de una versión publicada. Cuando `@grana/cli` esté disponible en npm, ejecutar:

```bash
npx @grana/cli check examples/themes/editorial-warm.grana.json
npx @grana/cli check examples/themes/utility-cool.grana.json
```

Después, asociar los CSS generados a una demo visual de la misma aplicación.
