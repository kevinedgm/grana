# Grana Starter

Demo mínima de una aplicación Vue 3 con Grana. Muestra:

- `GInput` con etiquetas, ayuda, errores y contraseña visible;
- `GBtn` con estado de carga;
- feedback anunciado con `role="status"`;
- tema claro, oscuro y preferencia del sistema;
- tokens generados por el plugin de Vite.

## Ejecutarla desde el monorepo

Mientras los paquetes no estén publicados:

```bash
npm install
npm run build
cd examples/starter
npm install
npm run dev
```

`npm run build` en la raíz genera los artefactos de `@grana/vue` que esta demo consume mediante dependencias locales. Cuando los paquetes estén publicados, sustituye las dependencias `file:` de `package.json` por las versiones publicadas de npm.

## Verificación pendiente al publicar

Antes de considerarla una demo oficial:

1. instalarla en un clon limpio;
2. ejecutar `npm run build`;
3. comprobar claro, oscuro, teclado y validación en navegadores objetivo;
4. probar cada tema de `examples/themes/`.
