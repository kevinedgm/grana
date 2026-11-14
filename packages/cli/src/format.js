// Formato común de diagnósticos para `theme`, `check` e `init` (salida de terminal, no API).
export const formatIssues = (issues) =>
  issues
    .map((i) => `${i.severity === 'error' ? '✖ error' : '⚠ aviso'} [${i.id}] ${i.message}\n    Por qué: ${i.why}`)
    .join('\n')
