<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: 'Items' },
  placeholder: { type: String, default: "Qo'shish..." },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const newItem = ref('')

function addItem() {
  const val = newItem.value.trim()
  if (!val) return
  emit('update:modelValue', [...props.modelValue, val])
  newItem.value = ''
}

function removeItem(index) {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}
</script>

<template>
  <div>
    <p class="text-body-2 font-weight-medium mb-2">{{ label }}</p>
    <div class="d-flex gap-2 mb-3">
      <VTextField
        v-model="newItem"
        :placeholder="placeholder"
        density="compact"
        hide-details
        :disabled="disabled"
        @keydown.enter.prevent="addItem"
      />
      <VBtn
        icon="tabler-plus"
        color="primary"
        size="small"
        variant="tonal"
        :disabled="disabled || !newItem.trim()"
        @click="addItem"
      />
    </div>
    <div v-if="modelValue.length" class="d-flex flex-wrap gap-2">
      <VChip
        v-for="(item, i) in modelValue"
        :key="i"
        :closable="!disabled"
        size="small"
        color="primary"
        variant="tonal"
        @click:close="removeItem(i)"
      >
        {{ item }}
      </VChip>
    </div>
    <p v-else class="text-caption text-medium-emphasis">Hali hech narsa qo'shilmagan</p>
  </div>
</template>
