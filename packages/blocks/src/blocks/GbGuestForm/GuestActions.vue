<script setup>
// El pie de envío de GbGuestForm (dueño: bruno; guest-form.md «Anatomía»): GFormActions [sticky en 03] › [«Atrás» ghost en
// 02] + «Siguiente» (02 antes del último paso) o el envío (solid, el último). En plantilla y no en una función de render:
// GFormActions lee su slot al montar para su aviso de la primaria, y con un slot de función de render Vue avisa «Slot
// "default" invoked outside of the render function» (hallazgo para @grana/vue). Interno de la sección; sin CSS.
import { GBtn, GFormActions, GIcon } from '@grana/vue'
import { has } from '../common/text.js'

defineOptions({ name: 'GbGuestFormActions' })
defineProps({
  g: { type: Object, required: true },
  action: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  variant: { type: String, required: true }
})
</script>

<template>
  <GFormActions :sticky="variant === '03'">
    <GBtn v-if="variant === '02' && g.index.value > 0" type="button" variant="ghost" @click="g.back">{{ g.stepLabels.value.back }}</GBtn>
    <GBtn v-if="variant === '02' && !g.last.value" type="button" variant="solid" @click="g.next">{{ g.stepLabels.value.next }}</GBtn>
    <GBtn v-else type="submit" variant="solid" :loading="busy" :loading-text="g.busyText.value">
      <template v-if="has(action.icon)" #prepend><GIcon :name="action.icon" /></template>
      {{ action.label }}
    </GBtn>
  </GFormActions>
</template>
