// Ficha interactiva de GAvatar. Sin imágenes de red: iniciales o icono.
export default {
  exclude: ['src', 'color', 'categories', 'colorKey'],
  text: ['name', 'initials', 'icon', 'label'],
  base: { name: { es: 'Ana María López', en: 'Ana María López' } },
  cases: [
    {
      title: { es: 'Persona con nombre', en: 'Person with a name' },
      why: { es: 'Las iniciales salen de la primera y la última palabra; decorativo si el nombre ya está escrito al lado.', en: 'Initials come from the first and last word; decorative when the name is already written next to it.' },
      props: { name: 'Luis Torres', size: 'lg' }
    },
    {
      title: { es: 'Color estable por categoría', en: 'Stable color per category' },
      why: { es: 'categories reparte los nombres entre los colores del tema con un hash estable: la misma persona siempre sale del mismo color. Sin ello, usa el neutro.', en: 'categories spreads names across theme colors with a stable hash: the same person always gets the same color. Without it, use the neutral.' },
      props: { name: 'Marta Ruiz', categories: 8, size: 'lg' }
    },
    {
      title: { es: 'Entidad en forma cuadrada con icono', en: 'Entity as a square with an icon' },
      why: { es: 'shape="square" distingue a una clínica de una persona; con label es una imagen con nombre para el lector.', en: 'shape="square" tells a clinic apart from a person; with label it is a named image for the reader.' },
      props: { name: '', icon: 'building-complex', shape: 'square', size: 'xl', label: { es: 'Clínica Reforma', en: 'Reforma Clinic' } }
    },
    {
      title: { es: 'Sin datos', en: 'No data' },
      why: { es: 'Sin imagen, iniciales ni icono cae al icono de usuario: la caja no cambia de tamaño al llegar los datos.', en: 'With no image, initials or icon it falls back to the user icon: the box does not change size when data arrives.' },
      props: { name: '', size: 'lg' }
    }
  ]
}
