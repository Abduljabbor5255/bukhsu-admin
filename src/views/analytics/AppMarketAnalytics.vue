<script setup>
import { useLoading } from "@/composable/useLoading"
import AppMarketStatCards from "@/views/analytics/view/AppMarketStatCards.vue"
import { ref } from "vue"

const { loading, startFetching, finishFetching } = useLoading()
const cardItems = ref([])

async function getCardsAnalytics() {
  try {
    startFetching()

    const { data } = await coinApi.fetchCardsAmount()

    cardItems.value = data.result

  } finally {
    finishFetching()
  }
}

getCardsAnalytics()
</script>

<template>
  <section class="analytics">
    <h2 class="table-title mb-5">
      Market analytics
    </h2>
    <AppMarketStatCards :cards="cardItems" />
  </section>
</template>

<style scoped lang="scss">

</style>
