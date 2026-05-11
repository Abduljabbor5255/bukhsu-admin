<script setup>
import { ref } from 'vue'

const buxduNextUrl = import.meta.env.VITE_BUXDU_NEXT_URL || 'http://localhost:3000'
const adminToken   = import.meta.env.VITE_ADMIN_TOKEN     || 'thinkopolis-admin'
const UPLOAD_URL   = `${buxduNextUrl}/api/upload/video`

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const uploading  = ref(false)
const progress   = ref(0)
const error      = ref('')
const isDragging = ref(false)
const inputRef   = ref(null)

function triggerPick() {
  if (!uploading.value) inputRef.value?.click()
}

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}
function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}
function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) uploadFile(file)
}

async function uploadFile(file) {
  const maxSize = 200 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = 'Fayl 200MB dan katta bo\'lmasligi kerak'
    return
  }

  error.value     = ''
  uploading.value = true
  progress.value  = 0

  try {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)
    xhr.setRequestHeader('x-admin-token', adminToken)

    xhr.upload.addEventListener('progress', ev => {
      if (ev.lengthComputable) progress.value = Math.round((ev.loaded / ev.total) * 100)
    })

    const result = await new Promise((resolve, reject) => {
      xhr.onload  = () => resolve(JSON.parse(xhr.responseText))
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(formData)
    })

    if (result.error) throw new Error(result.error)
    emit('update:modelValue', result.url)
  } catch (e) {
    error.value = e.message || 'Yuklashda xatolik'
  } finally {
    uploading.value = false
    if (inputRef.value) inputRef.value.value = ''
  }
}

function clear() {
  emit('update:modelValue', '')
  error.value = ''
}

</script>

<template>
  <div>
    <!-- Video preview -->
    <div v-if="modelValue" class="video-preview">
      <video
        :src="modelValue.startsWith('http') ? modelValue : `${buxduNextUrl}${modelValue}`"
        controls
        class="video-player"
      />
      <div class="d-flex align-center gap-2 mt-2">
        <VIcon icon="tabler-video" size="14" class="text-medium-emphasis" />
        <span class="text-caption text-medium-emphasis text-truncate" style="max-width: 220px">
          {{ modelValue.split('/').pop() }}
        </span>
        <VSpacer />
        <VBtn
          v-if="!disabled"
          icon="tabler-trash"
          color="error"
          variant="text"
          size="x-small"
          @click="clear"
        />
      </div>
    </div>

    <!-- Upload zone -->
    <div
      v-if="!modelValue && !disabled"
      class="video-drop-zone"
      :class="{ 'is-dragging': isDragging, 'is-uploading': uploading }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="triggerPick"
    >
      <input
        ref="inputRef"
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
        style="display: none"
        @change="onFileChange"
      />

      <!-- Uploading state -->
      <template v-if="uploading">
        <VIcon icon="tabler-loader-2" size="36" color="primary" class="mb-3 spin-icon" />
        <p class="text-body-2 font-weight-medium mb-1">Yuklanmoqda...</p>
        <VProgressLinear
          :model-value="progress"
          color="primary"
          rounded
          height="6"
          style="width: 200px"
          class="mb-1"
        />
        <p class="text-caption text-medium-emphasis">{{ progress }}%</p>
      </template>

      <!-- Idle / drag state -->
      <template v-else>
        <div class="drop-icon-wrap" :class="{ 'dragging-active': isDragging }">
          <VIcon
            :icon="isDragging ? 'tabler-player-play' : 'tabler-video-plus'"
            size="36"
            color="primary"
          />
        </div>
        <p class="text-body-2 font-weight-medium mt-3 mb-1">
          {{ isDragging ? 'Videoni bu yerga tashlang' : 'Video yuklash' }}
        </p>
        <p class="text-caption text-medium-emphasis">
          Drag & drop yoki <span class="text-primary" style="cursor:pointer">tanlang</span>
        </p>
        <p class="text-caption text-disabled mt-1">MP4, WebM, MOV · max 200 MB</p>
      </template>
    </div>

    <p v-if="error" class="text-caption text-error mt-2 d-flex align-center gap-1">
      <VIcon icon="tabler-alert-circle" size="13" /> {{ error }}
    </p>
  </div>
</template>

<style scoped>
.video-preview {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border-radius: 12px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.video-player {
  width: 100%;
  max-height: 220px;
  border-radius: 8px;
  background: #000;
  display: block;
}

.video-drop-zone {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: rgba(var(--v-theme-surface-variant), 0.25);
  user-select: none;
}

.video-drop-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.video-drop-zone.is-dragging {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}

.video-drop-zone.is-uploading {
  cursor: default;
  pointer-events: none;
}

.drop-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  transition: transform 0.2s, background 0.2s;
}

.drop-icon-wrap.dragging-active {
  transform: scale(1.1);
  background: rgba(var(--v-theme-primary), 0.18);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
