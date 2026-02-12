<script setup>
import { formatToPrice } from "@/util/filter/filter.util";
import AppStatCardLong from "@/views/analytics/components/AppStatCardLong.vue";
import AppStatCardShort from "@/views/analytics/components/AppStatCardShort.vue";

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <VRow>
    <VCol cols="4">
      <AppStatCardLong
        title="Total orders"
        :stats="formatToPrice(cards.orders_count)"
        icon="tabler-shopping-cart"
        color="primary"
        icon-size="32"
      />
    </VCol>
    <VCol cols="4">
      <AppStatCardLong
        title="Ordered"
        :stats="formatToPrice(cards.ordered)"
        icon="tabler-clock"
        color="warning"
        icon-size="32"
      />
    </VCol>
    <VCol cols="4">
      <AppStatCardLong
        title="Total expenses"
        :stats="formatToPrice(cards.expense)"
        icon="tabler-trending-down"
        color="error"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Accepted"
        :stats="cards.accepted"
        icon="tabler-briefcase"
        color="info"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Finished"
        :stats="cards.finished"
        icon="tabler-checkbox"
        color="success"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Collect"
        :stats="cards.collect"
        icon="tabler-package"
        color="warning"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="On the way"
        :stats="cards.on_the_way"
        icon="tabler-package"
        color="primary"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Documentation"
        :stats="cards.documentation"
        icon="tabler-file-check"
        color="primary"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Delivered"
        :stats="cards.delivered"
        icon="tabler-truck-delivery"
        color="warning"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Client rejected"
        :stats="cards.client_rejected"
        icon="tabler-user-x"
        color="error"
        icon-size="32"
      />
    </VCol>
    <VCol cols="3">
      <AppStatCardShort
        title="Merchant rejected"
        :stats="cards.client_rejected"
        icon="tabler-ban"
        color="error"
        icon-size="32"
      />
    </VCol>
  </VRow>
</template>

<style scoped lang="scss" />
