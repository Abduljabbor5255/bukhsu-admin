<script setup>
import { uploadApi } from "@/services/upload/upload.service"
import { onMounted, ref, watch } from "vue"

import FilePondImagePreview from "@/plugins/fileUploader/filepond-image-preview/js"
import FilePondPluginFileValidateType from '@/plugins/fileUploader/filepond-validate-type/js'
import * as FilePond from '@/plugins/fileUploader/filepond/js'

/*! CSS FILES */
import "@/plugins/fileUploader/filepond-image-preview/css/styles.css"
import "@/plugins/fileUploader/filepond/css/styles.css"
import { isArray } from "@/util/inspect"
import { isNull, isObject, isUndefined } from "@/util/inspect.util"
import { hasOwnProperty } from "@/util/object.util"

const props = defineProps({
  modelValue: {
    type: [Array, Object],
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
})

const emits = defineEmits(['update:modelValue'])

const inputId = ref(
  generateUUID(),
)

FilePond.registerPlugin(
  FilePondPluginFileValidateType,
  FilePondImagePreview,
)

let fieldValues = ref([])
let pondInstance = ref(null)

// eslint-disable-next-line sonarjs/cognitive-complexity
watch(() => props.modelValue, async pModelValue => {
  const isPropEmpty = isArray(pModelValue) && !pModelValue.length ||
    isNull(pModelValue) ||
    isUndefined(pModelValue)

  if (isPropEmpty) {
    fieldValues.value = []
    if (pondInstance.value) {
      pondInstance.value.removeFiles()
    }
  } else {
    let editItems = []

    if (isArray(pModelValue) && pModelValue.length && pondInstance.value) {
      editItems = pModelValue.filter(v => isObject(v))
    } else if (
      isObject(pModelValue)
      && hasOwnProperty(pModelValue, "path")
      && hasOwnProperty(pModelValue, "id")
    ) {
      editItems = [pModelValue]
    }

    if (editItems.length) {
      const { localFiles, excludeItems } = await getPropItems(editItems)

      if (excludeItems.length) {
        setValue(
          [...fieldValues.value, ...excludeItems],
        )
      }

      pondInstance.value.addFiles(
        localFiles.map(localFile => ({
          source: localFile.file,
          options: {
            type: 'local',
            metadata: {
              serverId: localFile.serverId,
            },
          },
        })),
      )
    }
  }
}, {
  immediate: true,
})

watch(fieldValues, fValues => {
  if (fValues.length) {
    emits('update:modelValue', props.multiple ? fValues : fValues[0])
  } else {
    emits('update:modelValue', null)
  }
})

onMounted(() => {
  initFilepond()
  removeFilepondLink()
})

function setValue(values) {
  fieldValues.value = values
}

function removeValue(rmId) {
  fieldValues.value = fieldValues.value.filter(({ id }) => {
    return id.toString() !== rmId.toString()
  })
}

async function getPropItems(items) {
  const excludeItems = []
  let localFiles = []

  items.forEach(prevItem => {
    const prevItemIndexInField = fieldValues.value.findIndex(({ id }) => id === prevItem.id)
    if (prevItemIndexInField === -1) {
      excludeItems.push(prevItem)
    }
  })

  if (excludeItems.length) {
    const blobFiles = excludeItems.map(eItem => restoreFile(eItem))
      .filter(remoteFile => !isNull(remoteFile) && isObject(remoteFile))

    localFiles = await Promise.all(blobFiles)
  }

  return { localFiles, excludeItems }
}

async function initFilepond() {
  if (pondInstance.value) {
    pondInstance.value.destroy()
  }

  const inputElement = document.getElementById(inputId.value)

  pondInstance.value = FilePond.create(inputElement, {
    acceptedFileTypes: ['image/*'],
    allowPaste: true,
    allowImageCrop: true,
    allowMultiple: props.multiple,
    allowImageEdit: true,
    allowImagePreview: true,
    labelIdle: props.label,
    server: {
      process: processTrigger,
      revert: (uniqueFileId, load) => {
        removeValue(uniqueFileId)
        load()
      },
      remove: (source, load) => {
        fieldValues.value = fieldValues.value.filter(({ name, size }) => {
          return name !== source.name && size?.toString() !== source.size.toString()
        })
        load()
      },
    },
  })
}

async function processTrigger(fieldName, file, metadata, load, error, progress, abort, transfer, options) {
  const controller = new AbortController()

  if (metadata.hasOwnProperty('type') && metadata.type === 'local') {
    load(
      metadata.serverId,
    )
  } else {
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

      load(
        uploadRsp.data.result.id,
      )

      addFileListener({
        result: uploadRsp.data.result,
      })
    } catch (eMessage) {
      error(eMessage)
    }
  }

  return {
    abort: () => {
      controller.abort()
      abort()
    },
  }
}

function addFileListener({ result }) {
  let vFiles = []

  if (fieldValues.value.length) {
    fieldValues.value.forEach(fValue => {
      vFiles.push(fValue)
    })
  }

  vFiles.push({
    extension: result.extension,
    path: result.path,
    name: result.name,
    id: result.id,
    size: result.size,
  })

  setValue(vFiles)
}

async function restoreFile(item) {
  const file = await convertUrlToFile(item)

  return {
    file,
    item,
    serverId: item.id,
  }
}

async function convertUrlToFile({ path, extension = 'jpeg', name = "imageFile" }) {
  try {
    let response = await fetch(path)
    let data = await response.blob()
    let metadata = {
      type: `image/${extension}`,
    }

    return new File([data], name, metadata)
  } catch (e) {
    return null
  }
}

function removeFilepondLink() {
  const filepondTags = document.getElementsByClassName('filepond--credits')

  Array.from(filepondTags).forEach(aTag => {
    aTag.remove()
  })
}

function generateUUID() {
  // Public Domain/MIT
  let d = new Date().getTime()//Timestamp
  let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0//Time in microseconds since page-load or 0 if unsupported

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16//random number between 0 and 16
    if(d > 0){//Use timestamp until depleted
      r = (d + r)%16 | 0
      d = Math.floor(d/16)
    } else {//Use microseconds since page-load if supported
      r = (d2 + r)%16 | 0
      d2 = Math.floor(d2/16)
    }

    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
</script>

<template>
  <div>
    <input
      :id="inputId"
      type="file"
      :disabled="disabled"
    >
  </div>
</template>


