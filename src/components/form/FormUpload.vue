<script setup>
import { uploadApi } from "@/services/upload/upload.service"
import { getFullImageUrl } from "@/util/helper"
import { computed, onMounted, ref, watch } from "vue"

import FilePondImagePreview from "@/plugins/fileUploader/filepond-image-preview/js"
import FilePondPluginFileValidateType from '@/plugins/fileUploader/filepond-validate-type/js'
import FilePondPluginImageCrop from 'filepond-plugin-image-crop'
import * as FilePond from '@/plugins/fileUploader/filepond/js'

/*! CSS FILES */
import "@/plugins/fileUploader/filepond-image-preview/css/styles.css"
import "@/plugins/fileUploader/filepond/css/styles.css"

const props = defineProps({
  modelValue: {
    type: [Array, Object, String],
    default: () => ([]),
  },
  name: {
    type: String,
    default: 'images',
  },
  uploadServiceName: {
    type: String,
    default: 'products',
  },
  label: {
    type: String,
    default: 'Drag & Drop your files or Browse',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  cropRatio: {
    type: String,
    default: null,  // e.g. '1:1', '3:4', '16:9'
  },
})

const emits = defineEmits(['update:modelValue'])

const inputId = ref(generateUUID())

FilePond.registerPlugin(
  FilePondPluginFileValidateType,
  FilePondImagePreview,
  FilePondPluginImageCrop,
)

let pondInstance = ref(null)

// All images (existing URLs from API + newly uploaded URLs)
const imageList = ref([])

// Track if we're currently emitting to prevent re-processing
let isEmitting = false

// Whether to show the FilePond input
const showUploader = computed(() => {
  if (props.disabled) return false
  if (props.multiple) return true
  return imageList.value.length === 0
})

// Watch modelValue for external changes (e.g. from fetchOneItem)
watch(() => props.modelValue, (newVal) => {
  if (isEmitting) return

  if (!newVal || (Array.isArray(newVal) && !newVal.length)) {
    imageList.value = []
    return
  }

  // Single string path from API
  if (typeof newVal === 'string') {
    const alreadyHave = imageList.value.some(img => img.path === newVal)
    if (!alreadyHave) {
      const displayUrl = getFullImageUrl(newVal)
      imageList.value = [{ path: newVal, displayUrl, id: generateUUID() }]
    }
    return
  }

  // Array of string paths
  if (Array.isArray(newVal) && newVal.length && typeof newVal[0] === 'string') {
    imageList.value = newVal.map(p => ({
      path: p,
      displayUrl: getFullImageUrl(p),
      id: generateUUID(),
    }))
    return
  }
}, { immediate: true })

// Emit value when imageList changes — always emit `path` for the backend
function emitValue() {
  isEmitting = true
  if (imageList.value.length === 0) {
    emits('update:modelValue', null)
  } else if (props.multiple) {
    emits('update:modelValue', imageList.value.map(img => img.path))
  } else {
    emits('update:modelValue', imageList.value[0].path)
  }
  // Reset flag on next tick
  setTimeout(() => { isEmitting = false }, 0)
}

function removeImage(index) {
  imageList.value.splice(index, 1)
  emitValue()
}

onMounted(() => {
  initFilepond()
  removeFilepondLink()
})

async function initFilepond() {
  if (pondInstance.value) {
    pondInstance.value.destroy()
  }

  const inputElement = document.getElementById(inputId.value)

  pondInstance.value = FilePond.create(inputElement, {
    acceptedFileTypes: ['image/*'],
    allowPaste: true,
    allowImageCrop: !!props.cropRatio,
    imageCropAspectRatio: props.cropRatio || undefined,
    allowMultiple: props.multiple,
    allowImageEdit: true,
    allowImagePreview: true,
    labelIdle: props.label,
    server: {
      process: processTrigger,
    },
  })
}

async function processTrigger(fieldName, file, metadata, load, error, progress, abort) {
  const controller = new AbortController()

  try {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: function (pEvent) {
        progress(pEvent.lengthComputable, pEvent.loaded, pEvent.total)
      },
      signal: controller.signal,
    }

    const uploadRsp = await uploadApi.uploads({
      config,
      body: formData,
      uploadServiceName: props.uploadServiceName,
    })

    // API returns { result: { path, full_url } }
    const responseData = uploadRsp.data
    const result = responseData.result || responseData
    const path = result.path || responseData.url
    const fullUrl = result.full_url || getFullImageUrl(path)

    // Add to our image list — path for backend, displayUrl for preview
    imageList.value.push({ path, displayUrl: fullUrl, id: generateUUID() })
    emitValue()

    load(path)

    // Remove from FilePond after short delay so it doesn't show duplicate preview
    setTimeout(() => {
      if (pondInstance.value) {
        pondInstance.value.removeFiles()
      }
    }, 300)
  } catch (eMessage) {
    error(eMessage)
  }

  return {
    abort: () => {
      controller.abort()
      abort()
    },
  }
}

function removeFilepondLink() {
  const filepondTags = document.getElementsByClassName('filepond--credits')
  Array.from(filepondTags).forEach(aTag => {
    aTag.remove()
  })
}

function generateUUID() {
  let d = new Date().getTime()
  let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16
    if(d > 0){
      r = (d + r)%16 | 0
      d = Math.floor(d/16)
    } else {
      r = (d2 + r)%16 | 0
      d2 = Math.floor(d2/16)
    }

    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
</script>

<template>
  <div>
    <!-- Image previews -->
    <div v-if="imageList.length" :class="multiple ? 'd-flex flex-wrap gap-3 mb-3' : 'mb-3'">
      <div
        v-for="(img, index) in imageList"
        :key="img.id"
        style="position: relative; display: inline-block;"
      >
        <img
          :src="img.displayUrl"
          style="min-width: 50px; min-height: 50px; max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); display: block; object-fit: cover;"
        />
        <button
          v-if="!disabled"
          type="button"
          @click="removeImage(index)"
          style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: rgb(var(--v-theme-error)); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- FilePond upload input -->
    <div v-show="showUploader">
      <input
        :id="inputId"
        type="file"
        :disabled="disabled"
      >
    </div>
  </div>
</template>
