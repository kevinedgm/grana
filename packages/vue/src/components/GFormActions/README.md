# GFormActions

Pie de acciones de un formulario: secundarias antes y **una** primaria al final, región de estado (`role="status"`) y, con `sticky`, fijo al borde inferior **sin tapar nunca el campo enfocado** (WCAG 2.4.11). En estrecho la primaria sube sola a su línea y las demás comparten la de debajo si caben.

**Etiqueta:** `<g-form-actions>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#pie-de-acciones-y-pie-fijo-gformactions).

## Uso

```vue
<GFormActions sticky :status="sucio ? 'Cambios sin guardar' : ''">
  <GBtn type="submit" variant="outline" formnovalidate name="intent" value="draft">Guardar borrador</GBtn>
  <GBtn type="submit">Guardar</GBtn>
</GFormActions>
```

## API en breve

`sticky`, `status` (o slot `status`), `density`; slot por defecto con los `GBtn`. Medido: 0 campos tapados con Tab a 1280 y 320px en Chromium, Firefox y WebKit; alto 61px, apilado 105px a 360 y 149px a 320. Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GFormActions.meta.json`](./GFormActions.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GFormActions.css`](./GFormActions.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
