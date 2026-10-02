# GFieldGroup

Una **pregunta compuesta cuyas partes necesitan su propia etiqueta** (contacto de emergencia; fecha en Día · Mes · Año): `fieldset` + `legend`, partes en una `GFormRow` interna y un solo mensaje. Va **siempre en su propia fila**. Para un dato que se lee como uno (teléfono, valor + unidad) usa `GInputGroup`.

**Etiqueta:** `<g-field-group>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#preguntas-compuestas-gfieldgroup).

## Uso

```vue
<GFieldGroup label="Fecha de la última consulta" name="ultima-consulta" keep hint="Por ejemplo, 27 3 2026">
  <GInput class="g-form-w-xs" label="Día" name="uc-dia" inputmode="numeric" />
  <GInput class="g-form-w-xs" label="Mes" name="uc-mes" inputmode="numeric" />
  <GInput class="g-form-w-sm" label="Año" name="uc-anio" inputmode="numeric" />
</GFieldGroup>
```

## API en breve

`label`, `hint`, `name`, `error`, `warning`, `valid`, `required`, `keep`, `disabled`, `readonly`, `density`, `id`; slots `label`, `hint` y por defecto. Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GFieldGroup.meta.json`](./GFieldGroup.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GFieldGroup.css`](./GFieldGroup.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
