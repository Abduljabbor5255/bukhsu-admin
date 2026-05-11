<script setup>
defineProps({ modelValue: { type: String, default: 'uz' } })
const emit = defineEmits(['update:modelValue'])

const LANGS = [
  { value: 'uz', label: "O'z", color: '#1a7f37' },
  { value: 'ru', label: 'Рус', color: '#0c5eb2' },
  { value: 'en', label: 'Eng', color: '#8b5cf6' },
]
</script>

<template>
  <div class="d-flex align-center gap-1 pa-1 rounded-lg"
       style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); background: rgba(var(--v-theme-surface-variant), 0.4)">
    <button
      v-for="l in LANGS" :key="l.value"
      type="button"
      class="lang-btn"
      :class="{ 'lang-btn--active': modelValue === l.value }"
      :style="modelValue === l.value ? `--lc: ${l.color}` : ''"
      @click="emit('update:modelValue', l.value)"
    >
      {{ l.label }}
    </button>
  </div>
</template>

<style scoped>
.lang-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.5);
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.03em;
}
.lang-btn:hover { color: rgba(var(--v-theme-on-surface), 0.9); background: rgba(var(--v-theme-on-surface), 0.06); }
.lang-btn--active { background: white; color: var(--lc, #1a7f37); box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
</style>
