<script setup>
import FormFileUpload from '@/components/form/FormFileUpload.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import LangTabs from '@/components/LangTabs.vue'
import { resourcesApi } from '@/services/resources/resources.service'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading = ref(false)
const lang = ref('uz')
const isSnackbarVisible = ref(false)
const snackbarText = ref('')

const docTypeOptions = [
  "O'quv qo'llanma", 'Maqola', 'Dissertatsiya', 'Monografiya',
  'Darslik', 'Jurnal', 'Adabiyotlar',
]
const languageOptions = [
  { title: "O'zbek", value: "O'zbek" },
  { title: 'Русский', value: 'Rus' },
  { title: 'English', value: 'Ingliz' },
]

const form = reactive({
  title: '', title_ru: '', title_en: '',
  date: '',
  doc_type: '',
  author: '',
  year: '',
  pages: '',
  language: '',
  description: '', description_ru: '', description_en: '',
  tags: [],
  pdf_file: null,
  cover_image: null,
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
    const r = data.result ?? data
    Object.assign(form, {
      title: r.title || '', title_ru: r.title_ru || '', title_en: r.title_en || '',
      date: r.date ? r.date.slice(0, 10) : '',
      doc_type: r.doc_type || '',
      author: r.author || '',
      year: r.year || '',
      pages: r.pages || '',
      language: r.language || '',
      description: r.description || '',
      description_ru: r.description_ru || '',
      description_en: r.description_en || '',
      tags: Array.isArray(r.tags) ? r.tags : [],
      pdf_file: r.pdf_file || null,
      cover_image: r.cover_image || null,
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
    <!-- Sticky header -->
    <div
      class="d-flex align-center justify-space-between mb-6 pa-4 bg-surface"
      style="position:sticky;top:64px;z-index:10;border-bottom:1px solid rgba(0,0,0,0.08)"
    >
      <div class="d-flex align-center gap-3">
        <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'resources' }" />
        <h2 class="text-h4">{{ isEdit ? 'Resursni tahrirlash' : 'Resurs yaratish' }}</h2>
      </div>
      <div class="d-flex align-center gap-3">
        <LangTabs v-model="lang" />
        <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
          Saqlash
        </VBtn>
      </div>
    </div>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" />

    <VRow>
      <!-- Main fields -->
      <VCol cols="12" md="8">

        <!-- Sarlavha -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Sarlavha</p>

            <VTextField
              v-if="lang === 'uz'"
              v-model="form.title"
              label="Sarlavha * (UZ)"
              :error-messages="errors.title"
              @input="errors.title = ''"
            />
            <VTextField
              v-else-if="lang === 'ru'"
              v-model="form.title_ru"
              label="Sarlavha (RU)"
            />
            <VTextField
              v-else
              v-model="form.title_en"
              label="Sarlavha (EN)"
            />
          </VCardText>
        </VCard>

        <!-- Tavsif -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Tavsif</p>

            <VTextarea
              v-if="lang === 'uz'"
              v-model="form.description"
              label="Tavsif (UZ)"
              rows="4"
              class="mb-4"
            />
            <VTextarea
              v-else-if="lang === 'ru'"
              v-model="form.description_ru"
              label="Tavsif (RU)"
              rows="4"
              class="mb-4"
            />
            <VTextarea
              v-else
              v-model="form.description_en"
              label="Tavsif (EN)"
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

        <!-- Asosiy ma'lumotlar -->
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Asosiy ma'lumotlar</p>
            <VRow>
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
                  item-title="title"
                  item-value="value"
                  clearable
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Sidebar: cover + PDF -->
      <VCol cols="12" md="4">

        <!-- Cover rasm -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Muqova rasmi</p>
            <FormUpload
              v-model="form.cover_image"
              label="Rasm yuklash"
              upload-service-name="resources"
              accept="image/*"
            />
          </VCardText>
        </VCard>

        <!-- PDF fayl -->
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
