// GbNewsletter · avisos de la sección que miran la instancia de la variante (dueño: bruno; newsletter.md «Avisos
// propios»). N3 lee las escuchas de la variante (con `submit` en `emits`, la escucha está en las props del vnode).
import { getCurrentInstance } from 'vue'

/** N3: sin escucha de `submit`, el correo no irá a ninguna parte. Se llama en el setup de cada variante. */
export function checkSubmitListener(warn) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vp = (getCurrentInstance() && getCurrentInstance().vnode.props) || {}
      if (!vp.onSubmit && !vp.onSubmitOnce) warn('N3', 'nadie escucha `submit`: el correo no irá a ninguna parte (N3).')
    }
  } catch {}
}
