// GbFooter · los datos del pie listos para pintar, compartido por las tres variantes (dueño: bruno; footer.md «Anatomía
// común», avisos C3 a C7, O1 a O3; #826 «cómo llego y cómo os escribo» primero).
import { computed, getCurrentInstance, onMounted } from 'vue'
import { entries } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { has } from '../common/text.js'
import { MAX_GROUPS } from './props.js'

/** O3: un `tel:` con letras o espacios (algunos teléfonos no marcan). */
export const looseTel = (href) => typeof href === 'string' && /^\s*tel:/i.test(href) && /[\sA-Za-z]/.test(href.trim().slice(4))

/**
 * @param {object} props  las de la sección
 * @param {Function} warn useWarn de la variante
 * @param {object} o      { groups: true } si la variante pinta las columnas (01 y 03); { address: true } si pinta la
 *                        dirección y el horario (01 y 03; 02 solo los canales)
 */
export function useFooter(props, warn, { groups: withGroups = false, address: withAddress = false } = {}) {
  const labels = computed(() => props.labels || {})
  const label = (k) => (has(labels.value[k]) ? labels.value[k] : undefined)
  const need = (k, what) => {
    const v = label(k)
    try { if (process.env.NODE_ENV !== 'production' && !v) warn(`C5:${k}`, `hay ${what} y falta labels.${k}: se pinta sin ese nombre (C5).`) } catch {}
    return v
  }

  const brand = computed(() => {
    const b = props.brand && typeof props.brand === 'object' ? props.brand : {}
    const logo = b.logo && typeof b.logo === 'object' && has(b.logo.src) ? b.logo : null
    if (logo) {
      try { if (process.env.NODE_ENV !== 'production' && !(logo.width > 0 && logo.height > 0)) checkMedia({ ...logo, alt: b.name || 'logo' }, 'brand.logo', warn) } catch {}
    }
    return { brand: b, logo, link: has(b.href) ? { label: b.name, href: b.href } : null }
  })

  const contact = computed(() => {
    const c = props.contact && typeof props.contact === 'object' ? props.contact : {}
    const channels = entries(c.channels, ['label', 'href'], 'contact.channels', warn)
    try {
      if (process.env.NODE_ENV !== 'production') {
        for (const e of channels) if (looseTel(e.item.href)) warn(`O3:${e.index}`, `contact.channels[${e.index}] «${e.item.href}» lleva letras o espacios: algunos teléfonos no marcan; escríbelo como tel:+529515550000 (O3).`)
      }
    } catch {}
    const lines = withAddress && Array.isArray(c.address) ? c.address.filter(has) : []
    const hours = withAddress && has(c.hours) ? c.hours : ''
    return { channels, lines, hours, any: channels.length > 0 || lines.length > 0 || Boolean(hours) }
  })

  const groupList = computed(() => {
    if (!withGroups) return []
    const raw = Array.isArray(props.groups) ? props.groups : []
    try { if (process.env.NODE_ENV !== 'production' && raw.length > MAX_GROUPS) warn('C7', `groups con ${raw.length} columnas; se recomiendan hasta ${MAX_GROUPS}: se pintan todas (C7).`) } catch {}
    return entries(raw, ['title'], 'groups', warn)
      .map((g) => ({ ...g, links: entries(g.item.links, ['label', 'href'], `groups[${g.index}].links`, warn) }))
      .filter((g) => g.links.length)
  })
  const navLabel = computed(() => (groupList.value.length ? need('nav', 'columnas de enlaces (groups)') : undefined))

  const legal = computed(() => entries(props.legal, ['label', 'href'], 'legal', warn))
  const legalLabel = computed(() => (legal.value.length ? need('legal', 'enlaces legales') : undefined))
  const social = computed(() => entries(props.social, ['label', 'href'], 'social', warn))
  const socialLabel = computed(() => (social.value.length ? need('social', 'redes (social)') : undefined))

  // O1: un footer dentro de otro footer o contentinfo (en el chasis, as="div")
  const inst = getCurrentInstance()
  onMounted(() => {
    try {
      if (process.env.NODE_ENV !== 'production' && props.as !== 'div') {
        const el = inst && inst.proxy && inst.proxy.$el
        const host = el && el.parentElement ? el.parentElement.closest('footer, [role="contentinfo"]') : null
        if (host) warn('O1', 'as="footer" dentro de otro footer o contentinfo (¿el slot footer de GAppShell?): usa as="div" (O1).')
      }
    } catch {}
  })

  return { brand, contact, groups: groupList, navLabel, legal, legalLabel, social, socialLabel, external: computed(() => label('external')) }
}
