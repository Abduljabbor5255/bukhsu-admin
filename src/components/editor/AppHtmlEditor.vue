<script setup>
import { computed, ref, watch } from "vue"
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  name: {
    type: String,
    default: 'htmlEditor',
  },
  placeholder: {
    type: String,
    default: 'Enter text ...',
  },
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Field',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['update:modelValue'])

const editorOption = {
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false].reverse() }],

      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],

      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],

      [{ color: [] }, { background: [] }],
      [{ align: [] }],
    ],
  },
}

const quillEditorRef = ref(null)
const quillContent = ref(props.modelValue)

watch(() => props.modelValue, mv => {
  if(mv !== quillContent.value){
    quillContent.value = mv
  }
}, {
  immediate: true,
})

watch(quillContent, qc => {
  if(quillContent.value.trim() ==='<p><br></p>'){
    quillContent.value = ''
  }

  if(quillContent.value === ''){
    quillEditorRef.value.setContents([])
  }

  emits('update:modelValue', quillContent.value)
})
</script>

<template>
  <QuillEditor
    ref="quillEditorRef"
    v-model:content="quillContent"
    theme="snow"
    content-type="html"
    :options="editorOption"
    :read-only="disabled"
  />
</template>

<style lang="scss">
@use "vuetify/settings";
.app-html-editor {
  min-height: 100px;
  border-radius: 0 0 6px 6px;
}

.ql-toolbar {
  border-radius: 6px 6px 0 0;
}

.app-html-editor .ql-editor {
  height: 100px !important;
  min-height: 100px !important;
  font-size: 14px !important;
}

.ql-editor.ql-blank::before{
  color: settings.$card-color;
}

.ql-toolbar.ql-snow .ql-formats .ql-header .ql-picker-label::before{
  color: settings.$card-color;
}

.ql-toolbar.ql-snow .ql-formats .ql-fill,
.ql-toolbar.ql-snow .ql-formats .ql-stroke,
.ql-toolbar.ql-snow .ql-formats .ql-script{
  stroke: settings.$card-color;
}
</style>
