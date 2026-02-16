<script setup>
import { useLoading } from "@/composable/useLoading"
import { toursApi } from "@/services/tours/tours.service"
import { getValueMatchLocale } from "@/util/helper"
import { toTypedSchema } from '@vee-validate/yup'
import { useForm } from 'vee-validate'
import { onMounted, ref } from "vue"
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
  { title: 'Joylashuv', key: 'location', sortable: false },
  { title: 'Mamlakat', key: 'country', sortable: false },
  { title: 'Sana', key: 'dateRange', sortable: false },
  { title: 'Holat', key: 'isPublished', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

const multiLangObj = () => yup.object({
  uz: yup.string().required('Majburiy maydon'),
  ru: yup.string().required('Majburiy maydon'),
  en: yup.string().required('Majburiy maydon'),
})

const { values, defineComponentBinds, handleSubmit, resetForm, setValues, errors } = useForm({
  initialValues: {
    location: { uz: '', ru: '', en: '' },
    country: { uz: '', ru: '', en: '' },
    image: null,
    dateRange: '',
    description: { uz: '', ru: '', en: '' },
  },
  validationSchema: toTypedSchema(yup.object({
    location: multiLangObj(),
    country: multiLangObj(),
    image: yup.number().required('Majburiy maydon'),
    dateRange: yup.string().required('Majburiy maydon'),
    description: multiLangObj(),
  })),
})

const modalForm = {
  location: {
    uz: defineComponentBinds('location.uz'),
    ru: defineComponentBinds('location.ru'),
    en: defineComponentBinds('location.en'),
  },
  country: {
    uz: defineComponentBinds('country.uz'),
    ru: defineComponentBinds('country.ru'),
    en: defineComponentBinds('country.en'),
  },
  image: defineComponentBinds('image'),
  dateRange: defineComponentBinds('dateRange'),
  description: {
    uz: defineComponentBinds('description.uz'),
    ru: defineComponentBinds('description.ru'),
    en: defineComponentBinds('description.en'),
  },
}

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
      location: r.location || { uz: '', ru: '', en: '' },
      country: r.country || { uz: '', ru: '', en: '' },
      image: r.image ? (typeof r.image === 'object' ? r.image.id : r.image) : null,
      dateRange: r.dateRange || '',
      description: r.description || { uz: '', ru: '', en: '' },
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
        <template #item.location="{ item }">
          {{ getValueMatchLocale(item.raw.location) }}
        </template>

        <template #item.country="{ item }">
          {{ getValueMatchLocale(item.raw.country) }}
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
          <!-- Location -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.location.uz" label="Joylashuv (UZ)" :error-messages="errors['location.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.location.ru" label="Joylashuv (RU)" :error-messages="errors['location.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.location.en" label="Joylashuv (EN)" :error-messages="errors['location.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Country -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.country.uz" label="Mamlakat (UZ)" :error-messages="errors['country.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.country.ru" label="Mamlakat (RU)" :error-messages="errors['country.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.country.en" label="Mamlakat (EN)" :error-messages="errors['country.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Image (Upload) -->
          <VCol cols="12">
            <FormUpload v-bind="modalForm.image" name="image" label="Rasm" upload-service-name="tours" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['image'] }}</span>
          </VCol>

          <!-- Date Range -->
          <VCol cols="12">
            <VTextField v-bind="modalForm.dateRange" label="Sana oralig'i" placeholder="15-20 Iyun 2024" :error-messages="errors['dateRange']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Description -->
          <VCol cols="12">
            <VTextarea v-bind="modalForm.description.uz" label="Tavsif (UZ)" :error-messages="errors['description.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.description.ru" label="Tavsif (RU)" :error-messages="errors['description.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.description.en" label="Tavsif (EN)" :error-messages="errors['description.en']" :disabled="isDisabledForm" />
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
