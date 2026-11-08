// Ficha interactiva de GBreadcrumbs. El meta.json solo trae items y labels: el interés está en los datos, que van en los casos.

const lotes = (en) => ['0411', '0412', '0413'].map((n) => ({ label: (en ? 'Batch 2026-' : 'Lote 2026-') + n, href: '#lote-' + n }))

const larga = {
  es: [
    { label: 'Inicio', href: '#inicio', icon: 'house' },
    { label: 'Laboratorio central', href: '#laboratorio' },
    { label: 'Muestras', href: '#muestras' },
    { label: '2026', children: lotes(false) },
    { label: 'Lote 2026-0412', href: '#lote-0412' },
    { label: 'Muestra M-0007' }
  ],
  en: [
    { label: 'Home', href: '#inicio', icon: 'house' },
    { label: 'Central laboratory', href: '#laboratorio' },
    { label: 'Samples', href: '#muestras' },
    { label: '2026', children: lotes(true) },
    { label: 'Batch 2026-0412', href: '#lote-0412' },
    { label: 'Sample M-0007' }
  ]
}

const corta = {
  es: [{ label: 'Inicio', href: '#inicio', icon: 'house' }, { label: 'Pacientes', href: '#pacientes' }, { label: 'Lucía Fernández' }],
  en: [{ label: 'Home', href: '#inicio', icon: 'house' }, { label: 'Patients', href: '#pacientes' }, { label: 'Lucía Fernández' }]
}

const hermanos = {
  es: [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Ajustes', href: '#ajustes', children: [{ label: 'Perfil', href: '#perfil' }, { label: 'Equipo', href: '#equipo' }, { label: 'Facturación', href: '#facturacion' }] },
    { label: 'Notificaciones' }
  ],
  en: [
    { label: 'Home', href: '#inicio' },
    { label: 'Settings', href: '#ajustes', children: [{ label: 'Profile', href: '#perfil' }, { label: 'Team', href: '#equipo' }, { label: 'Billing', href: '#facturacion' }] },
    { label: 'Notifications' }
  ]
}

export default {
  exclude: ['labels'],
  block: true,
  base: {
    items: larga,
    labels: {
      es: { nav: 'Ruta de navegación', up: 'Subir a {label}', path: 'Ruta hasta {label}', children: 'Otras páginas en {label}' },
      en: { nav: 'Breadcrumb', up: 'Up to {label}', path: 'Path to {label}', children: 'Other pages in {label}' }
    }
  },
  cases: [
    {
      title: { es: 'Jerarquía profunda de un laboratorio', en: 'Deep hierarchy in a laboratory' },
      why: {
        es: 'Seis niveles: en poco ancho la fila cede y aparece «Subir» y la escalera. Un nivel sin href (2026) es texto y sus hijos encienden una puerta.',
        en: 'Six levels: in little width the row yields and “Up” and the stairs appear. A level without href (2026) is text and its children light a door.'
      },
      props: { items: larga }
    },
    {
      title: { es: 'Ficha de un paciente', en: 'A patient record' },
      why: {
        es: 'Tres niveles bastan: raíz con icono, lista y página actual (siempre el último, sin enlace). Con dos niveles o menos, un botón «Atrás» suele servir mejor.',
        en: 'Three levels are enough: root with icon, list and current page (always the last one, no link). With two levels or fewer, a “Back” button often works better.'
      },
      props: { items: corta }
    },
    {
      title: { es: 'Saltar entre páginas hermanas', en: 'Jump between sibling pages' },
      why: {
        es: 'children en un nivel enciende una puerta con sus hermanos (Perfil, Equipo, Facturación) para cambiar de sección sin subir. Úsalo solo si de verdad se salta entre hermanos.',
        en: 'children on a level lights a door with its siblings (Profile, Team, Billing) to switch sections without going up. Use it only if people really jump between siblings.'
      },
      props: { items: hermanos }
    }
  ]
}
