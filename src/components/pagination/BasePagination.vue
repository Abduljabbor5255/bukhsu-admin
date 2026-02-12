<script setup>
import { computed } from "vue"

const props = defineProps({
  modelValue: {
    type: [Number, String],
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const vPage = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  },
})

function change(key){
  if(typeof key === 'number'){
    vPage.value = key
  }
}
</script>


<template>
  <VPagination v-model="vPage">
    <template #item="slotProps">
      <VBtn
        :variant="slotProps.isActive ? 'elevated':'tonal'"
        color="default"
        :icon="false"
        @click="change(slotProps.key)"
      >
        {{ slotProps.page }}
      </VBtn>
    </template>


    <template #prev="slotProps">
      <VBtn
        variant="tonal"
        color="default"
        v-bind="slotProps"
        size="38"
        icon
      >
        <VIcon
          icon="mdi-chevron-left"
          size="large"
        />
      </VBtn>
    </template>

    <template #next="slotProps">
      <VBtn
        variant="tonal"
        color="default"
        v-bind="slotProps"
        size="38"
        icon
      >
        <VIcon
          icon="mdi-chevron-right"
          size="large"
        />
      </VBtn>
    </template>
  </VPagination>
</template>

