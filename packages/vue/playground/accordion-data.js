// Datos de la demostración de GAccordion (dueño: bruno): sección #sec-accordion del playground y banco accordion.html.
// Preguntas frecuentes con avance, ajustes con avance que sigue al estado, exclusive con una respuesta larga, sticky bajo
// una cabecera fija, suelto, lazy (window.__acLazyMounts cuenta los montajes del contenido) y un diálogo.
window.granaAccordionDemo = function (reactive) {
  const AC_PREP = [
    'Dos días antes: evita bebidas con gas, chicle y alimentos que producen gases (frijoles, brócoli, coliflor, cebolla).',
    'La noche anterior: cena ligera antes de las 21:00. Después, solo agua natural.',
    'El día del estudio: ayuno de 8 horas. Si tomas medicamentos, tómalos con un sorbo de agua salvo que tu médico indique otra cosa.',
    'Una hora antes: bebe un litro de agua y no orines hasta terminar el estudio; la vejiga llena ayuda a ver los órganos de la pelvis.',
    'Qué llevar: la orden médica, estudios anteriores de la misma zona y una lista de tus medicamentos.',
    'Durante el estudio: te pedirán recostarte y respirar hondo varias veces; el gel es frío, pero no duele.',
    'Después: puedes comer con normalidad. Los resultados llegan a tu expediente en línea en cinco días hábiles.',
    'Si estás embarazada o crees estarlo, avísalo al agendar: cambia la preparación.'
  ]
  const ac = reactive({
    faq: ['resultados'], excl: ['resultados'], solo: false, dlg: false, lazyMounts: 0,
    notif: { mail: true, push: true, weekly: true, public: false },
    prep: AC_PREP,
    prepGroups: [{ t: 'Dos días antes', lines: AC_PREP.slice(0, 4) }, { t: 'La noche anterior', lines: AC_PREP.slice(1, 6) }, { t: 'El día del estudio', lines: AC_PREP.slice(2, 8) }, { t: 'Después', lines: AC_PREP.slice(5, 8) }],
    questions: [
      { v: 'cambiar', t: '¿Puedo cambiar la fecha de mi cita?', first: 'Sí, hasta 24 horas antes desde «Mis citas» o llamando a recepción; después de ese plazo el cambio cuenta como cancelación tardía.', more: ['Si cambias la cita de un estudio con preparación, revisa de nuevo las indicaciones: algunas dependen del día de la semana.'] },
      { v: 'documentos', t: '¿Qué documentos necesito el primer día?', first: 'Una identificación oficial, la credencial de tu seguro si tienes uno y la orden médica si te envía otra clínica.', more: ['Si vienes por un menor de edad, trae también su acta de nacimiento o CURP.'] },
      { v: 'resultados', t: '¿Cuánto tardan los resultados?', first: 'Los estudios de laboratorio están listos en 48 horas hábiles; los de imagen, en cinco días hábiles.', more: ['Te avisamos por correo cuando estén disponibles en tu expediente en línea.', 'Algunos cultivos tardan hasta diez días: el día de la toma te dirán la fecha exacta.'] },
      { v: 'historial', t: 'Historial de pagos', meta: 'Disponible tras tu primera cita', disabled: true, first: 'Aquí verás tus pagos y facturas cuando tengas tu primera cita.', more: [] },
      { v: 'pago', t: '¿Cómo puedo pagar?', first: 'Con tarjeta, transferencia o efectivo en recepción; con convenio de tu aseguradora solo pagas el deducible.', more: ['La factura se pide en las 72 horas siguientes al pago.'] },
      { v: 'largo', t: '¿Qué pasa si no puedo cumplir el ayuno de ocho horas por una condición médica como la diabetes o un tratamiento que me obliga a comer?', first: 'Llama antes a recepción para reprogramar en el primer turno de la mañana; nunca suspendas un medicamento sin hablar con tu médico.', more: [] },
      { v: 'estacionamiento', t: '¿Hay estacionamiento?', first: 'Sí, con acceso por la calle de atrás; las dos primeras horas no tienen costo.', more: ['La entrada al estacionamiento subterráneo está junto a la farmacia; deja tu boleto en recepción.'], anchor: 'ac-dato-entrada' },
      { v: 'urgencias', t: '¿Atienden urgencias?', first: 'No. Esta clínica atiende con cita; ante una urgencia llama al 911 o acude al hospital más cercano.', more: [] }
    ],
    resetNotif: () => Object.assign(ac.notif, { mail: true, push: true, weekly: true }),
    lazyMounted: () => { ac.lazyMounts++; window.__acLazyMounts = ac.lazyMounts },
    get notifPeek() {
      const on = [ac.notif.mail && 'Correo', ac.notif.push && 'push'].filter(Boolean)
      return [on.length ? on.join(' y ') : 'Sin avisos', ac.notif.weekly ? 'resumen semanal' : 'sin resumen'].join(' · ')
    },
    get notifCount() { return [ac.notif.mail, ac.notif.push, ac.notif.weekly].filter(Boolean).length + ' activas' }
  })
  return ac
}
