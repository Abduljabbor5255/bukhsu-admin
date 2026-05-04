<script setup>
import { uploadApi } from '@/services/upload/upload.service'
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: null },
  uploadServiceName: { type: String, default: 'resources' },
  label: { type: String, default: 'Fayl yuklash' },
  accept: { type: String, default: '.pdf,.doc,.docx' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const uploading = ref(false)
const currentPath = ref(null)
const displayName = ref('')

watch(() => props.modelValue, (val) => {
  currentPath.value = val
  if (val) displayName.value = val.split('/').pop()
  else displayName.value = ''
}, { immediate: true })

async function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await uploadApi.uploads({
      body: formData,
      uploadServiceName: props.uploadServiceName,
      config: { headers: { 'Content-Type': 'multipart/form-data' } },
    })
    const result = data.result || data
    const url = result.full_url || result.path || data.url
    currentPath.value = url
    displayName.value = file.name
    emit('update:modelValue', url)
  } catch (e) {
    console.error(e)
  } finally {
    uploading.value = false
    if (inputRef.value) inputRef.value.value = ''
  }
}

function clearFile() {
  currentPath.value = null
  displayName.value = ''
  emit('update:modelValue', null)
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      style="display:none"
      @change="handleFileChange"
    />

    <div v-if="currentPath" class="d-flex align-center gap-3 pa-3 rounded border">
      <VIcon
        :icon="accept.includes('video') ? 'tabler-video' : accept.includes('image') ? 'tabler-photo' : 'tabler-file-type-pdf'"
        :color="accept.includes('video') ? 'info' : accept.includes('image') ? 'success' : 'error'"
        size="28"
      />
      <a :href="currentPath" target="_blank" class="text-body-2 flex-grow-1 text-truncate" style="color: inherit; text-decoration: none;">{{ displayName || currentPath }}</a>
      <VBtn
        v-if="!disabled"
        icon="tabler-x"
        size="x-small"
        color="error"
        variant="text"
        @click="clearFile"
      />
    </div>

    <VBtn
      v-else-if="!disabled"
      variant="tonal"
      color="primary"
      prepend-icon="tabler-upload"
      :loading="uploading"
      @click="inputRef?.click()"
    >
      {{ label }}
    </VBtn>

    <p v-else-if="!currentPath" class="text-caption text-medium-emphasis">Fayl yuklanmagan</p>
  </div>
</template>
