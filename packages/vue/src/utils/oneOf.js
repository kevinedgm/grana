// Validador de props: el valor debe estar en la lista
export const oneOf = (list) => (value) => list.includes(value)
