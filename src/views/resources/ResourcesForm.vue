<script setup>
import FormFileUpload from '@/components/form/FormFileUpload.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import { resourcesApi } from '@/services/resources/resources.service'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading = ref(false)
const isSnackbarVisible = ref(false)
const snackbarText = ref('')

const docTypeOptions = ['article', 'book', 'thesis', 'report', 'conference']
const languageOptions = [
  { title: "O'zbek", value: 'uz' },
  { title: 'Русский', value: 'ru' },
  { title: 'English', value: 'en' },
]

const form = reactive({
  title: '',
  date: '',
  doc_type: '',
  author: '',
  year: '',
  pages: '',
  language: '',
  description: '',
  tags: [],
  pdf_file: null,
})

const errors = reactive({ title: '' })

function validate() {
  errors.title = form.title.trim() ? '' : 'Majburiy maydon'
  return !errors.title
}

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await resourcesApi.findOne({ params: { id } })
    const r = data.result
    Object.assign(form, {
      title: r.title || '',
      date: r.date ? r.date.slice(0, 10) : '',
      doc_type: r.doc_type || '',
      author: r.author || '',
      year: r.year || '',
      pages: r.pages || '',
      language: r.language || '',
      description: r.description || '',
      tags: Array.isArray(r.tags) ? r.tags : [],
      pdf_file: r.pdf_file || null,
    })
  } catch (e) {
    console.error(e)
  } finally {
    pageLoading.value = false
  }
}

async function submit() {
  if (!validate()) return
  btnLoading.value = true
  try {
    const payload = { type: 'resource', draft: false, ...form }
    if (isEdit.value) {
      await resourcesApi.update({ params: { id: route.params.id, ...payload } })
      snackbarText.value = 'Resurs yangilandi'
    } else {
      await resourcesApi.create({ params: payload })
      snackbarText.value = 'Resurs yaratildi'
    }
    isSnackbarVisible.value = true
    setTimeout(() => router.push({ name: 'resources' }), 800)
  } catch (e) {
    console.error(e)
  } finally {
    btnLoading.value = false
  }
}

onMounted(() => {
  if (isEdit.value) fetchItem(route.params.id)
})
</script>

<template>
  <section>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center gap-3">
        <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'resources' }" />
        <h2 class="text-h4">{{ isEdit ? 'Resursni tahrirlash' : 'Resurs yaratish' }}</h2>
      </div>
      <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
        Saqlash
      </VBtn>
    </div>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" />

    <VRow>
      <!-- Main fields -->
      <VCol cols="12" md="8">
        <!-- Basic info -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Asosiy ma'lumotlar</p>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.title"
                  label="Sarlavha *"
                  :error-messages="errors.title"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.date" label="Sana" type="date" />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.doc_type"
                  label="Hujjat turi"
                  :items="docTypeOptions"
                  clearable
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.author" label="Muallif" />
              </VCol>
              <VCol cols="12" md="3">
                <VTextField v-model="form.year" label="Yil" type="number" />
              </VCol>
              <VCol cols="12" md="3">
                <VTextField v-model="form.pages" label="Sahifalar" type="number" />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.language"
                  label="Til"
                  :items="languageOptions"
                  clearable
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Description and tags -->
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Kontent</p>
            <VTextarea
              v-model="form.description"
              label="Tavsif"
              rows="4"
              class="mb-4"
            />
            <RepeatableList
              v-model="form.tags"
              label="Teglar"
              placeholder="Teg qo'shish..."
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- File upload -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">PDF Fayl</p>
            <FormFileUpload
              v-model="form.pdf_file"
              label="PDF yuklash"
              upload-service-name="resources"
              accept=".pdf,.doc,.docx"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar v-model="isSnackbarVisible" color="success">{{ snackbarText }}</VSnackbar>
  </section>
</template>
