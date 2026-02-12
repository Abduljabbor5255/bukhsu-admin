<script setup>
import { useI18n } from "vue-i18n"

const { t } = useI18n()
</script>


<template>
  <div
    class="d-flex justify-center align-center text-h6"
    style="min-height:70vh"
  >
    {{ t('noInformationFound') }}
  </div>
</template>

