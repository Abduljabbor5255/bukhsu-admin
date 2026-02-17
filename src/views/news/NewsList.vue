<script setup>
import { useLoading } from "@/composable/useLoading"
import { newsApi } from "@/services/news/news.service"
import { getValueMatchLocale } from "@/util/helper"
import { toTypedSchema } from '@vee-validate/yup'
import { useField, useForm } from 'vee-validate'
import { computed, onMounted, reactive, ref } from "vue"
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as yup from 'yup'

import AppModal from "@/components/AppModal.vue"
import DeleteModal from "@/components/DeleteModal.vue"
import FormUpload from "@/components/form/FormUpload.vue"
import BasePagination from "@/components/pagination/BasePagination.vue"

const { loading, startFetching, finishFetching } = useLoading()

const items = ref([])
const totalItems = ref(0)
const itemsPerPage = ref(10)
const currentPage = ref(1)

const showModal = ref(false)
const isDisabledForm = ref(false)
const isDeleteModal = ref(false)
const isSnackbarVisible = ref(false)
const snackbarText = ref("")
const itemID = ref(null)
const btnLoading = ref(false)
const isPublished = ref(true)

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Rasm', key: 'mainImage', sortable: false },
  { title: 'Sarlavha', key: 'title', sortable: false },
  { title: 'Kategoriya', key: 'category', sortable: false },
  { title: 'Holat', key: 'isPublished', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

const multiLangObj = () => yup.object({
  uz: yup.string().required('Majburiy maydon'),
  ru: yup.string().required('Majburiy maydon'),
  en: yup.string().required('Majburiy maydon'),
})

const { values, handleSubmit, resetForm, setValues, errors } = useForm({
  initialValues: {
    title: { uz: '', ru: '', en: '' },
    content: { uz: '', ru: '', en: '' },
    category: { uz: '', ru: '', en: '' },
    mainImage: null,
    videoUrl: '',
    gallery: [],
  },
  validationSchema: toTypedSchema(yup.object({
    title: multiLangObj(),
    content: multiLangObj(),
    category: multiLangObj(),
    mainImage: yup.mixed().required('Majburiy maydon'),
    videoUrl: yup.string().nullable(),
    gallery: yup.array().nullable(),
  })),
})

const makeLangFields = (basePath) => {
  const { value: uz, errorMessage: uzError, handleBlur: uzBlur } = useField(`${basePath}.uz`)
  const { value: ru, errorMessage: ruError, handleBlur: ruBlur } = useField(`${basePath}.ru`)
  const { value: en, errorMessage: enError, handleBlur: enBlur } = useField(`${basePath}.en`)

  const uzProps = computed(() => ({
    'error-messages': uzError.value,
    onBlur: uzBlur,
  }))
  const ruProps = computed(() => ({
    'error-messages': ruError.value,
    onBlur: ruBlur,
  }))
  const enProps = computed(() => ({
    'error-messages': enError.value,
    onBlur: enBlur,
  }))

  return reactive({
    uz, uzProps,
    ru, ruProps,
    en, enProps,
  })
}

const title = makeLangFields('title')
const content = makeLangFields('content')
const category = makeLangFields('category')

const { value: mainImage } = useField('mainImage')
const { value: gallery } = useField('gallery')

const { value: videoUrl, errorMessage: videoUrlError, handleBlur: videoUrlBlur } = useField('videoUrl')
const videoUrlProps = computed(() => ({
  'error-messages': videoUrlError.value,
  onBlur: videoUrlBlur,
}))

async function fetchItems() {
  startFetching()
  try {
    const { data } = await newsApi.findAll({
      params: {
        page: currentPage.value,
        limit: itemsPerPage.value,
      },
    })
    items.value = data.result
    totalItems.value = data.pagination.total
  } catch (e) {
    console.error(e)
  } finally {
    finishFetching()
  }
}

async function fetchOneItem(id, mode = 'edit') {
  itemID.value = id
  isDisabledForm.value = mode === 'show'
  startFetching()
  try {
    const { data } = await newsApi.findOne({ params: { id } })
    const r = data.result
    setValues({
      title: r.title || { uz: '', ru: '', en: '' },
      content: r.content || { uz: '', ru: '', en: '' },
      category: r.category || { uz: '', ru: '', en: '' },
      mainImage: r.mainImage || null,
      videoUrl: r.videoUrl || '',
      gallery: (r.gallery || []).map(g => g.image),
    })
    isPublished.value = r.isPublished !== undefined ? r.isPublished : true
    showModal.value = true
  } catch (e) {
    console.error(e)
  } finally {
    finishFetching()
  }
}

const submitItem = handleSubmit(async (formValues) => {
  btnLoading.value = true
  try {
    const payload = {
      ...formValues,
      isPublished: isPublished.value,
    }
    if (itemID.value) {
      await newsApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Yangilik muvaffaqiyatli yangilandi"
    } else {
      await newsApi.create({ params: payload })
      snackbarText.value = "Yangilik muvaffaqiyatli yaratildi"
    }
    isSnackbarVisible.value = true
    closeModals()
    fetchItems()
  } catch (e) {
    console.error(e)
  } finally {
    btnLoading.value = false
  }
})

async function deleteItem() {
  btnLoading.value = true
  try {
    await newsApi.remove({ params: { id: itemID.value } })
    snackbarText.value = "Yangilik muvaffaqiyatli o'chirildi"
    isSnackbarVisible.value = true
    closeDeleteModal()
    fetchItems()
  } catch (e) {
    console.error(e)
  } finally {
    btnLoading.value = false
  }
}

function openCreateModal() {
  resetForm()
  itemID.value = null
  isDisabledForm.value = false
  isPublished.value = true
  showModal.value = true
}

function openDeleteModal(id) {
  itemID.value = id
  isDeleteModal.value = true
}

function closeModals() {
  showModal.value = false
  itemID.value = null
  resetForm()
}

function closeDeleteModal() {
  isDeleteModal.value = false
  itemID.value = null
}

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <section>
    <VCard>
      <VCardText class="d-flex justify-space-between align-center">
        <h2 class="text-h4">Yangiliklar</h2>
        <VBtn @click="openCreateModal" color="primary" prepend-icon="tabler-plus">
          Qo'shish
        </VBtn>
      </VCardText>

      <VDataTableServer
        :items="items"
        :items-length="totalItems"
        :headers="headers"
        :loading="loading"
        class="text-no-wrap"
      >
        <template #item.mainImage="{ item }">
          <div class="py-2">
            <VImg
              v-if="item.raw.mainImage"
              :src="item.raw.mainImage"
              width="50"
              height="50"
              cover
              class="rounded"
            />
          </div>
        </template>

        <template #item.title="{ item }">
          {{ getValueMatchLocale(item.raw.title) }}
        </template>

        <template #item.category="{ item }">
          {{ getValueMatchLocale(item.raw.category) }}
        </template>

        <template #item.isPublished="{ item }">
          <VChip :color="item.raw.isPublished ? 'success' : 'warning'" size="small">
            {{ item.raw.isPublished ? 'Faol' : 'Nofaol' }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <IconBtn size="small" @click="fetchOneItem(item.raw.id, 'edit')">
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn size="small" color="error" @click="openDeleteModal(item.raw.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>

        <template #bottom>
          <div class="d-flex justify-center pa-4">
            <BasePagination
              v-model="currentPage"
              :length="Math.ceil(totalItems / itemsPerPage)"
              :total-visible="5"
              @update:model-value="fetchItems"
            />
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <AppModal v-model="showModal" @close-modal="closeModals">
      <template #header>
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Yangilik yaratish' }}</h3>
      </template>
      <template #body>
        <VRow>
          <!-- Title -->
          <VCol cols="12">
            <VTextField v-model="title.uz" v-bind="title.uzProps" label="Sarlavha (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="title.ru" v-bind="title.ruProps" label="Sarlavha (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="title.en" v-bind="title.enProps" label="Sarlavha (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Content -->
          <VCol cols="12">
            <VTextarea v-model="content.uz" v-bind="content.uzProps" label="Kontent (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="content.ru" v-bind="content.ruProps" label="Kontent (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="content.en" v-bind="content.enProps" label="Kontent (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Category -->
          <VCol cols="12" md="4">
            <VTextField v-model="category.uz" v-bind="category.uzProps" label="Kategoriya (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="category.ru" v-bind="category.ruProps" label="Kategoriya (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="category.en" v-bind="category.enProps" label="Kategoriya (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Main Image (Upload) -->
          <VCol cols="12">
            <label class="text-body-2 font-weight-medium mb-1 d-block">Asosiy rasm</label>
            <FormUpload v-model="mainImage" name="mainImage" label="Asosiy rasm yuklash" upload-service-name="news" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['mainImage'] }}</span>
          </VCol>

          <!-- Gallery (Multiple) -->
          <VCol cols="12">
            <label class="text-body-2 font-weight-medium mb-1 d-block">Galereya rasmlari</label>
            <FormUpload v-model="gallery" name="gallery" label="Galereya rasmlarini yuklash" upload-service-name="news" :multiple="true" :disabled="isDisabledForm" />
          </VCol>

          <!-- Video URL -->
          <VCol cols="12">
            <VTextField v-model="videoUrl" v-bind="videoUrlProps" label="Video URL" :disabled="isDisabledForm" />
          </VCol>

          <!-- Is Published -->
          <VCol cols="12">
            <VSwitch v-model="isPublished" label="Chop etilsinmi?" :disabled="isDisabledForm" />
          </VCol>
        </VRow>
      </template>
      <template #footer>
        <div class="d-flex justify-end gap-2 mt-4" v-if="!isDisabledForm">
          <VBtn color="secondary" variant="tonal" @click="closeModals">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="btnLoading" @click="submitItem">Saqlash</VBtn>
        </div>
      </template>
    </AppModal>

    <DeleteModal v-model="isDeleteModal" @close-modal="closeDeleteModal">
      <template #header>
        <h3>Yangilikni o'chirish</h3>
      </template>
      <template #body>
        Haqiqatan ham bu yangilikni o'chirmoqchimisiz?
      </template>
      <template #footer>
        <div class="d-flex justify-end gap-2 mt-4">
          <VBtn color="secondary" variant="tonal" @click="closeDeleteModal">Bekor qilish</VBtn>
          <VBtn color="error" :loading="btnLoading" @click="deleteItem">O'chirish</VBtn>
        </div>
      </template>
    </DeleteModal>

    <VSnackbar v-model="isSnackbarVisible" color="success">
      {{ snackbarText }}
    </VSnackbar>
  </section>
</template>
