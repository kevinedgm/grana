# GFormLayout

Pila vertical de filas de un formulario: cada hijo directo (una `GFormRow`, un campo suelto, un `GFieldGroup`, casillas, interruptores) ocupa el ancho entero, separado por `--g-form-gap`. No mide nada; provee `block`, densidad y `stack` a lo que contiene. Sustituye a `GFormGrid` (Fase 1).

**Etiqueta:** `<g-form-layout>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#guía-de-distribución).

## Uso

```vue
<GFormLayout>
  <GFormRow>
    <GInput label="Nombre" name="nombre" />
    <GInput label="Apellido" name="apellido" />
  </GFormRow>
  <GTextarea label="Comentarios" name="comentarios" />
</GFormLayout>
```

## API en breve

`stack` (Boolean, `false`: un campo por línea en todas las filas, salvo `keep`) y `density`. Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GFormLayout.meta.json`](./GFormLayout.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GFormLayout.css`](./GFormLayout.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
