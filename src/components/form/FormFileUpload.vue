<script setup>
import { uploadApi } from '@/services/upload/upload.service'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue:        { type: String, default: null },
  uploadServiceName: { type: String, default: 'resources' },
  label:             { type: String, default: 'Fayl yuklash' },
  accept:            { type: String, default: '.pdf,.doc,.docx' },
  disabled:          { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const inputRef    = ref(null)
const uploading   = ref(false)
const progress    = ref(0)
const isDragging  = ref(false)
const currentPath = ref(null)
const displayName = ref('')
const error       = ref('')

watch(() => props.modelValue, val => {
  currentPath.value = val
  displayName.value = val ? val.split('/').pop() : ''
}, { immediate: true })

const isImage = computed(() =>
  props.accept.includes('image') ||
  /\.(png|jpe?g|webp|gif|svg)$/i.test(displayName.value)
)

const fileIcon = computed(() => {
  if (isImage.value) return 'tabler-photo'
  if (props.accept.includes('video')) return 'tabler-video'
  if (/pdf/i.test(props.accept) || /\.pdf$/i.test(displayName.value)) return 'tabler-file-type-pdf'
  return 'tabler-file'
})

const fileColor = computed(() => {
  if (isImage.value) return 'success'
  if (props.accept.includes('video')) return 'info'
  if (/pdf/i.test(displayName.value)) return 'error'
  return 'primary'
})

const acceptLabel = computed(() => {
  if (props.accept.includes('image') && props.accept.includes('pdf')) return 'Rasm yoki PDF'
  if (props.accept.includes('image')) return 'Rasm'
  if (props.accept.includes('video')) return 'Video'
  if (props.accept.includes('pdf')) return 'PDF'
  return 'Fayl'
})

function onDragOver(e) { e.preventDefault(); isDragging.value = true }
function onDragLeave()  { isDragging.value = false }
function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) upload(file)
}
function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) upload(file)
}

async function upload(file) {
  error.value     = ''
  uploading.value = true
  progress.value  = 0
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await uploadApi.uploads({
      body: formData,
      uploadServiceName: props.uploadServiceName,
      config: {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          if (ev.lengthComputable) progress.value = Math.round((ev.loaded / ev.total) * 100)
        },
      },
    })
    const result = data.result || data
    const url = result.full_url || result.path || data.url
    currentPath.value = url
    displayName.value = file.name
    emit('update:modelValue', url)
  } catch (e) {
    error.value = 'Yuklashda xatolik yuz berdi'
    console.error(e)
  } finally {
    uploading.value = false
    if (inputRef.value) inputRef.value.value = ''
  }
}

function clearFile() {
  currentPath.value = null
  displayName.value = ''
  error.value       = ''
  emit('update:modelValue', null)
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      style="display: none"
      @change="onFileChange"
    />

    <!-- Uploaded file preview -->
    <div v-if="currentPath" class="file-preview">
      <!-- Image preview -->
      <div v-if="isImage" class="image-preview-wrap">
        <img :src="currentPath" alt="preview" class="image-preview" />
        <div class="image-preview-footer">
          <VIcon :icon="fileIcon" size="14" :color="fileColor" />
          <a
            :href="currentPath"
            target="_blank"
            class="text-caption text-truncate flex-grow-1"
            style="color: inherit; text-decoration: none; max-width: 180px"
          >{{ displayName }}</a>
          <VBtn v-if="!disabled" icon="tabler-x" size="x-small" color="error" variant="text" @click="clearFile" />
        </div>
      </div>

      <!-- File preview -->
      <div v-else class="d-flex align-center gap-3 pa-3 rounded-lg file-item">
        <div class="file-icon-wrap">
          <VIcon :icon="fileIcon" :color="fileColor" size="22" />
        </div>
        <div class="flex-grow-1 min-width-0">
          <a
            :href="currentPath"
            target="_blank"
            class="text-body-2 font-weight-medium d-block text-truncate"
            style="color: inherit; text-decoration: none; max-width: 220px"
          >{{ displayName || 'Fayl' }}</a>
          <p class="text-caption text-medium-emphasis mb-0">{{ acceptLabel }} · yuklangan</p>
        </div>
        <VBtn v-if="!disabled" icon="tabler-x" size="x-small" color="error" variant="text" @click="clearFile" />
      </div>
    </div>

    <!-- Drop zone -->
    <div
      v-else-if="!disabled"
      class="file-drop-zone"
      :class="{ 'is-dragging': isDragging, 'is-uploading': uploading }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="inputRef?.click()"
    >
      <!-- Uploading -->
      <template v-if="uploading">
        <VIcon icon="tabler-loader-2" size="28" color="primary" class="spin-icon mb-2" />
        <p class="text-body-2 font-weight-medium mb-1">Yuklanmoqda...</p>
        <VProgressLinear
          :model-value="progress"
          color="primary"
          rounded
          height="4"
          style="width: 160px"
          class="mb-1"
        />
        <p class="text-caption text-medium-emphasis">{{ progress }}%</p>
      </template>

      <!-- Idle -->
      <template v-else>
        <div class="drop-icon-wrap" :class="{ 'dragging-active': isDragging }">
          <VIcon :icon="isDragging ? 'tabler-download' : fileIcon" size="24" color="primary" />
        </div>
        <p class="text-body-2 font-weight-medium mt-2 mb-0">
          {{ isDragging ? 'Bu yerga tashlang' : label }}
        </p>
        <p class="text-caption text-medium-emphasis mt-1 mb-0">
          {{ acceptLabel }} · <span class="text-primary" style="cursor:pointer">tanlang</span>
        </p>
      </template>
    </div>

    <p v-else-if="!currentPath" class="text-caption text-medium-emphasis">Fayl yuklanmagan</p>

    <p v-if="error" class="text-caption text-error mt-1 d-flex align-center gap-1">
      <VIcon icon="tabler-alert-circle" size="13" /> {{ error }}
    </p>
  </div>
</template>

<style scoped>
.file-drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 10px;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: rgba(var(--v-theme-primary), 0.04);
  user-select: none;
}

.file-drop-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.file-drop-zone.is-dragging {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}

.file-drop-zone.is-uploading {
  cursor: default;
  pointer-events: none;
}

.drop-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  transition: transform 0.2s, background 0.2s;
}

.drop-icon-wrap.dragging-active {
  transform: scale(1.12);
  background: rgba(var(--v-theme-primary), 0.18);
}

.file-preview {
  border-radius: 10px;
  overflow: hidden;
}

.image-preview-wrap {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  display: block;
}

.image-preview-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
}

.file-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.file-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
