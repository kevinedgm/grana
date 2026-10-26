<script setup>
// El pie de GbCheckout (dueño: bruno; checkout.md «Anatomía»): GFormActions [sticky en 03, que cuida 2.4.11 dentro de
// GForm] (status = el total: GText body-sm con labels.total y GPrice md del total del pedido, dentro de la GPriceScope del
// bloque) › [«Atrás» ghost, no valida (01, 03; desde el segundo paso)] + el botón del paso (type="submit", step.action,
// loading = busy). En plantilla: GFormActions lee su slot al montar (como GuestActions de Guest form). Interno; sin CSS.
import { GBtn, GFormActions, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'

defineOptions({ name: 'GbCheckoutActions' })
defineProps({
  k: { type: Object, required: true },
  total: { type: Object, default: null },
  sticky: { type: Boolean, default: false },
  withBack: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  priceLocale: { type: String, default: undefined }
})
</script>

<template>
  <GFormActions :sticky="sticky">
    <template v-if="total" #status>
      <GText size="body-sm">{{ k.L.value.total }} <GPrice :value="total.value" size="md" :locale="priceLocale" /></GText>
    </template>
    <GBtn v-if="withBack && k.index.value > 0" type="button" variant="ghost" @click="k.back">{{ k.L.value.back }}</GBtn>
    <GBtn type="submit" variant="solid" :loading="busy" :loading-text="k.busyText.value">{{ k.steps.value[k.index.value] ? k.steps.value[k.index.value].step.action : '' }}</GBtn>
  </GFormActions>
</template>
