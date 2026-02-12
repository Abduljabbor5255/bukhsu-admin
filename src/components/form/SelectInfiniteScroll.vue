<script setup>
import { computed } from "vue"

const props = defineProps({
  items: {
    type: Array,
    default: () => ([]),
  },
  itemText: {
    type: String,
    default: 'name',
  },
  itemValue: {
    type: String,
    default: 'id',
  },
  label: {
    type: String,
    default: 'Select item',
  },
  loading: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: [Array, Object, Boolean, String, Number],
    default: null,
  },
  clearable: {
    type: Boolean,
    default: false,
    required: false,
  },
})

const emits = defineEmits(['load', 'update:modelValue'])

const selectValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})

function onIntersect(isScrollingDown) {
  if(isScrollingDown){
    emits('load')
  }
}
</script>


<template>
  <VAutocomplete
    v-model="selectValue"
    :items="props.items"
    :label="props.label"
    :item-title="props.itemText"
    :item-value="props.itemValue"
    autocomplete="off"
    :clearable="clearable"
  >
    <template #append-item>
      <div
        v-intersect="onIntersect"
        class="d-flex justify-center align-center"
      >
        <VProgressCircular
          v-if="props.loading"
          indeterminate
          :size="40"
          color="primary"
        />
      </div>
    </template>
  </VAutocomplete>
</template>
