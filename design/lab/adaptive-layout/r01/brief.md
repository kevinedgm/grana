# Kiwi · layout adaptativo automático · r01

Usuario: desarrollador de aplicaciones de negocio con formularios, paneles y componentes de tamaños diferentes. Tarea: colocar contenido con un único contenedor y configuración mínima, sin calcular columnas, píxeles ni breakpoints por dispositivo.

Contexto: ficha de paciente; Calle requiere espacio para texto libre, Exterior e Interior admiten valores cortos. A 460 px de contenedor Calle debe ir arriba y ambos números juntos debajo, manteniendo un ancho útil contenido. El motor no reconoce nombres como Calle: aplica el mismo cálculo a cualquier secuencia de perfiles.

Alcance de esta ronda: prototipo funcional independiente, motor puro y demostración de medición de etiquetas, rango numérico, límites, agrupación, alineación física y dirección. No componente Vue, contrato, CSS de producción ni migración. No red, lectura de globals de aplicación ni deducción a partir de lo escrito en vivo.

Solapamiento: GFormRow ya tiene partición contigua por mínimos/pesos, medición compartida y pistas etiqueta/caja/pie. Decisiones #171–175 exigen filas explícitas y llenar ancho, #172 estira compacto solo. La nueva petición de usuario justifica explorar otra política; esta ronda propone un contenedor opt-in, sin alterar esos contratos. Reutilizar la infraestructura de observación al implementar; generalizar el planificador solo con Lima y Bruno, sin dos motores de producción que diverjan.
