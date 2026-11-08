// Ficha interactiva de GAvatarMotion. El estado es un control; la ficha no usa v-model.
export default {
  exclude: [],
  text: ['label'],
  base: { label: { es: 'Asistente de citas', en: 'Appointment assistant' }, size: 'xl' },
  cases: [
    {
      title: { es: 'Asistente que está pensando', en: 'Assistant that is thinking' },
      why: { es: 'thinking mientras se espera la respuesta; cámbialo a success o error al terminar. No lo uses para esperas de otra cosa que el asistente.', en: 'thinking while waiting for the reply; switch to success or error when done. Do not use it to wait for anything but the assistant.' },
      props: { state: 'thinking', color: 'brand', size: 'xl' }
    },
    {
      title: { es: 'Respuesta lista', en: 'Reply ready' },
      why: { es: 'success es un estado de una sola vez: anima y vuelve a idle; done avisa cuando termina.', en: 'success is a one-time state: it animates and returns to idle; done fires when it ends.' },
      props: { state: 'success', color: 'success', size: 'lg' }
    },
    {
      title: { es: 'Llama la atención sin ruido', en: 'Draws attention quietly' },
      why: { es: 'attention con idleLoop para un asistente que espera al usuario; con reduced motion queda quieto.', en: 'attention with idleLoop for an assistant waiting on the user; under reduced motion it stays still.' },
      props: { state: 'attention', idleLoop: true, color: 'accent', size: 'lg' }
    }
  ]
}
