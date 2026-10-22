// Avisos de desarrollo de los bloques (dueño: bruno; _comun.md §5). Guarda canónica de #653 dentro del ayudante y en el
// sitio de cada texto (api.md «Avisos de desarrollo»): `try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`.
// Una vez por instancia y motivo; prefijo `[Grana Gb<Sección><NN>]`.

/** Devuelve `warn(key, text)` para un bloque; cada llamada con texto lleva también la guarda. */
export function useWarn(name) {
  const seen = new Set()
  return (key, text) => {
    try {
      if (process.env.NODE_ENV !== 'production' && !seen.has(key)) {
        seen.add(key)
        console.warn(`[Grana ${name}] ${text}`)
      }
    } catch {}
  }
}
