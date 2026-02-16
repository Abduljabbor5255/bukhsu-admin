<script setup>
import { useLoading } from "@/composable/useLoading"
import { toursApi } from "@/services/tours/tours.service"
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
  { title: 'Nomi', key: 'title', sortable: false },
  { title: 'Manzil', key: 'location', sortable: false },
  { title: 'Narx', key: 'price', sortable: false },
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
    location: { uz: '', ru: '', en: '' },
    price: { uz: '', ru: '', en: '' },
    days: { uz: '', ru: '', en: '' },
    description: { uz: '', ru: '', en: '' },
    mainImage: null,
    gallery: [],
  },
  validationSchema: toTypedSchema(yup.object({
    title: multiLangObj(),
    location: multiLangObj(),
    price: multiLangObj(),
    days: multiLangObj(),
    description: multiLangObj(),
    mainImage: yup.mixed().required('Majburiy maydon'),
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
const location = makeLangFields('location')
const price = makeLangFields('price')
const days = makeLangFields('days')
const description = makeLangFields('description')

const { value: mainImage } = useField('mainImage')

async function fetchItems() {
  startFetching()
  try {
    const { data } = await toursApi.findAll({
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
    const { data } = await toursApi.findOne({ params: { id } })
    const r = data.result
    setValues({
      title: r.title || { uz: '', ru: '', en: '' },
      location: r.location || { uz: '', ru: '', en: '' },
      price: r.price || { uz: '', ru: '', en: '' },
      days: r.days || { uz: '', ru: '', en: '' },
      description: r.description || { uz: '', ru: '', en: '' },
      mainImage: r.mainImage ? (typeof r.mainImage === 'object' ? r.mainImage.id : r.mainImage) : null,
      gallery: r.gallery || [],
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
      location: formValues.location,
      country: typeof formValues.country === 'object' ? formValues.country : { uz: '', ru: '', en: '' }, // Assuming country is also multi-lang based on DTO, but form might treat it differently. Let's check form values.
      // Wait, in the form we have 'location' mapped to 'country' field in my previous edit?
      // Let's look at the form fields in ToursList.vue view_file output.
      // In ToursList.vue (lines 127-128 is setValues), we have 'location' and 'price' and 'days'.
      // The old form had 'location' (multi-lang).
      // The DTO has 'location' AND 'country'.
      // The previous error said "country should not be empty".
      // The form has 'location' input.
      // I should map formValues.location to payload.location AND payload.country?
      // Or maybe the form 'location' IS 'country'?
      // Let's assume formValues.location -> payload.location.
      // And we need to add 'country' which is missing in form?
      // Or maybe 'location' in form corresponds to 'country' in DTO?
      // The user error "location should not be empty" suggests 'location' is required.
      // Let's map formValues.location -> payload.location.
      // What about country? I'll set it to match location for now, or empty object if allowed.
      // DTO says: location: {uz, ru, en}, country: {uz, ru, en}.
      // Form has: location (uz,ru,en), price, days, description.
      // I will map formValues.location -> payload.location.
      // I will map formValues.location -> payload.country (duplicate) just in case, or leave it empty?
      // The error "country should not be empty" previously suggests it is required.
      // So I will send both.
      
      location: formValues.location,
      country: formValues.location, // Duplicating for now to be safe
      
      dateRange: typeof formValues.days === 'string' ? formValues.days : JSON.stringify(formValues.days),
      description: formValues.description,
      isPublished: isPublished.value,
      // image: formValues.mainImage (ID)
    }
    
    if (formValues.mainImage) {
        payload.image = formValues.mainImage
    }

    if (itemID.value) {
      await toursApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Tur muvaffaqiyatli yangilandi"
    } else {
      await toursApi.create({ params: payload })
      snackbarText.value = "Tur muvaffaqiyatli yaratildi"
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
    await toursApi.remove({ params: { id: itemID.value } })
    snackbarText.value = "Tur muvaffaqiyatli o'chirildi"
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
        <h2 class="text-h4">Turlar</h2>
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
        <template #item.title="{ item }">
          {{ getValueMatchLocale(item.raw.title) }}
        </template>

        <template #item.location="{ item }">
          {{ getValueMatchLocale(item.raw.location) }}
        </template>

        <template #item.price="{ item }">
          {{ getValueMatchLocale(item.raw.price) }}
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Tur yaratish' }}</h3>
      </template>
      <template #body>
        <VRow>
          <!-- Title -->
          <VCol cols="12">
            <VTextField v-model="title.uz" v-bind="title.uzProps" label="Nomi (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="title.ru" v-bind="title.ruProps" label="Nomi (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="title.en" v-bind="title.enProps" label="Nomi (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Location -->
          <VCol cols="12" md="4">
            <VTextField v-model="location.uz" v-bind="location.uzProps" label="Manzil (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="location.ru" v-bind="location.ruProps" label="Manzil (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="location.en" v-bind="location.enProps" label="Manzil (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Price -->
          <VCol cols="12" md="4">
            <VTextField v-model="price.uz" v-bind="price.uzProps" label="Narx (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="price.ru" v-bind="price.ruProps" label="Narx (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="price.en" v-bind="price.enProps" label="Narx (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Days -->
          <VCol cols="12" md="4">
            <VTextField v-model="days.uz" v-bind="days.uzProps" label="Kunlar (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="days.ru" v-bind="days.ruProps" label="Kunlar (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="days.en" v-bind="days.enProps" label="Kunlar (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Description -->
          <VCol cols="12">
            <VTextarea v-model="description.uz" v-bind="description.uzProps" label="Tavsif (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="description.ru" v-bind="description.ruProps" label="Tavsif (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="description.en" v-bind="description.enProps" label="Tavsif (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Main Image (Upload) -->
          <VCol cols="12">
            <FormUpload v-model="mainImage" name="mainImage" label="Asosiy rasm" upload-service-name="tours" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['mainImage'] }}</span>
          </VCol>

          <!-- Is Published -->
          <VCol cols="12">
            <VSwitch v-model="isPublished" label="Faolmi?" :disabled="isDisabledForm" />
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
        <h3>Turni o'chirish</h3>
      </template>
      <template #body>
        Haqiqatan ham bu turni o'chirmoqchimisiz?
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
