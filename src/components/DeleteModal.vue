<script setup>
const emit = defineEmits(['closeModal'])
</script>

<template>
  <VDialog class="v-col-12 v-col-sm-6">
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="$emit('closeModal')" />

    <VCard class="share-project-dialog pa-5 pa-sm-8">
      <header>
        <slot name="header" />
      </header>
      <main>
        <slot name="body" />
      </main>
      <footer>
        <slot name="footer" />
      </footer>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.share-project-dialog {
  .card-list {
    --v-card-list-gap: 1rem;
  }
}
</style>
