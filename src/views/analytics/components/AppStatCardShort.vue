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
    <VCardText class="statistics d-flex align-center justify-start">
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
      <div class="statistics-details">
        <p class="statistics-title">
          {{ props.stats }}
        </p>
        <span class="statistics-description">{{ props.title }}</span>
      </div>
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

  &-details {
    margin-left: .75rem;
  }
}
</style>
