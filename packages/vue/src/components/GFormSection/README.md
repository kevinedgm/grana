# GFormSection

Sección fija de un formulario (una idea: Información básica, Contacto): título `hN`, descripción, acciones secundarias y ayuda, separada por aire y tipografía, sin tarjeta ni punto de referencia. Con `optional`, una insignia «Opcional» sustituye a los «(opcional)» de sus campos.

**Etiqueta:** `<g-form-section>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#secciones-gformsection).

## Uso

```vue
<GFormSection title="Datos fiscales" description="Solo si el paciente pide factura." optional>
  <GFormLayout>…</GFormLayout>
</GFormSection>
```

## API en breve

`title`, `description`, `headingLevel` (por defecto el de `GForm`), `optional`; slots `title`, `description`, `actions`, `help` y por defecto. `mode`, `open`, `added`, `headerPlacement` y `labels` están reservadas para la Fase 3. Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GFormSection.meta.json`](./GFormSection.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GFormSection.css`](./GFormSection.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
