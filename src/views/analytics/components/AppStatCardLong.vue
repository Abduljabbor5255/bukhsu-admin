<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: false,
    default: 'primary',
  },
  icon: {
    type: String,
    required: true,
  },
  stats: {
    type: String,
    required: true,
  },
  iconSize: {
    type: String,
    required: false,
    default: '32',
  },
})
</script>

<template>
  <VCard>
    <VCardText class="statistics d-flex align-center justify-space-between">
      <div>
        <p class="statistics-title">
          {{ props.stats }}
        </p>
        <span class="statistics-description">{{ props.title }}</span>
      </div>
      <VAvatar
        v-if="props.icon"
        size="52"
        variant="tonal"
        :color="props.color"
      >
        <VIcon
          :size="props.iconSize"
          :icon="props.icon"
        />
      </VAvatar>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
  .statistics {
    &-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: .5rem;
    }

    &-description {
      font-size: 16px;
      font-weight: 500;
    }
  }
</style>
