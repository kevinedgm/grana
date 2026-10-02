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

### Icono antes del título: slot `lead` (#203)

```vue
<GFormSection title="Acceso y seguridad" description="Quién puede editar este registro.">
  <template #lead><GIcon name="lock-open" /></template>
  <GFormLayout>…</GFormLayout>
</GFormSection>
```

El `lead` es **decorativo** (`aria-hidden`) y va **fuera** del `hN`: el encabezado se llama solo por su título. Sin el slot no hay hueco ni aire; **no hay icono por defecto**. El icono toma el tamaño del título (16px con el tema por defecto) y el color `text-muted`, y queda centrado en la **primera línea** del título aunque este ocupe varias, con o sin insignia `optional` y en RTL (medido: 0px de diferencia; contraste ≥ 7,38:1 en claro y ≥ 8,59:1 en oscuro con doce temas; ver [`design/lab/icons/auditoria.md`](../../../../../design/lab/icons/auditoria.md)). Usa un [`GIcon`](../GIcon/README.md) sin `label` y sin clases de tamaño.

## API en breve

`title`, `description`, `headingLevel` (por defecto el de `GForm`), `optional`; slots `lead`, `title`, `description`, `actions`, `help` y por defecto. `mode`, `open`, `added`, `headerPlacement` y `labels` están reservadas para la Fase 3. Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GFormSection.meta.json`](./GFormSection.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GFormSection.css`](./GFormSection.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
