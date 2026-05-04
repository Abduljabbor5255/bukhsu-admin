<script setup>
import { useLoading } from "@/composable/useLoading"
import { contestsApi } from "@/services/contests/contests.service"
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
  { title: 'Boshlanish', key: 'startDate', sortable: false },
  { title: 'Tugash', key: 'endDate', sortable: false },
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
    description: { uz: '', ru: '', en: '' },
    mainImage: null,
    startDate: '',
    endDate: '',
  },
  validationSchema: toTypedSchema(yup.object({
    title: multiLangObj(),
    description: multiLangObj(),
    mainImage: yup.mixed().nullable(),
    startDate: yup.string().nullable(),
    endDate: yup.string().nullable(),
  })),
})

const makeLangFields = (basePath) => {
  const { value: uz, errorMessage: uzError, handleBlur: uzBlur } = useField(`${basePath}.uz`)
  const { value: ru, errorMessage: ruError, handleBlur: ruBlur } = useField(`${basePath}.ru`)
  const { value: en, errorMessage: enError, handleBlur: enBlur } = useField(`${basePath}.en`)

  const uzProps = computed(() => ({ 'error-messages': uzError.value, onBlur: uzBlur }))
  const ruProps = computed(() => ({ 'error-messages': ruError.value, onBlur: ruBlur }))
  const enProps = computed(() => ({ 'error-messages': enError.value, onBlur: enBlur }))

  return reactive({ uz, uzProps, ru, ruProps, en, enProps })
}

const title = makeLangFields('title')
const description = makeLangFields('description')

const { value: mainImage } = useField('mainImage')
const { value: startDate, errorMessage: startDateError } = useField('startDate')
const { value: endDate, errorMessage: endDateError } = useField('endDate')

const startDateProps = computed(() => ({ 'error-messages': startDateError.value }))
const endDateProps = computed(() => ({ 'error-messages': endDateError.value }))

async function fetchItems() {
  startFetching()
  try {
    const { data } = await contestsApi.findAll({
      params: { page: currentPage.value, limit: itemsPerPage.value },
    })
    items.value = data.result
    totalItems.value = data.meta?.total || 0
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
    const { data } = await contestsApi.findOne({ params: { id } })
    const r = data.result
    setValues({
      title: r.title || { uz: '', ru: '', en: '' },
      description: r.description || { uz: '', ru: '', en: '' },
      mainImage: r.mainImage || null,
      startDate: r.startDate || '',
      endDate: r.endDate || '',
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
    const payload = { ...formValues, isPublished: isPublished.value }
    if (itemID.value) {
      await contestsApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Tanlov muvaffaqiyatli yangilandi"
    } else {
      await contestsApi.create({ params: payload })
      snackbarText.value = "Tanlov muvaffaqiyatli yaratildi"
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
    await contestsApi.remove({ params: { id: itemID.value } })
    snackbarText.value = "Tanlov muvaffaqiyatli o'chirildi"
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
        <h2 class="text-h4">Tanlovlar</h2>
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
            >
              <template #error>
                <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3 rounded">
                  <VIcon icon="tabler-photo-off" size="24" color="grey-darken-1" />
                </div>
              </template>
            </VImg>
          </div>
        </template>

        <template #item.title="{ item }">
          {{ getValueMatchLocale(item.raw.title) }}
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Tanlov yaratish' }}</h3>
      </template>
      <template #body>
        <VRow>
          <VCol cols="12">
            <VTextField v-model="title.uz" v-bind="title.uzProps" label="Sarlavha (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="title.ru" v-bind="title.ruProps" label="Sarlavha (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="title.en" v-bind="title.enProps" label="Sarlavha (EN)" :disabled="isDisabledForm" />
          </VCol>

          <VCol cols="12">
            <VTextarea v-model="description.uz" v-bind="description.uzProps" label="Tavsif (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="description.ru" v-bind="description.ruProps" label="Tavsif (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="description.en" v-bind="description.enProps" label="Tavsif (EN)" :disabled="isDisabledForm" />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField v-model="startDate" v-bind="startDateProps" label="Boshlanish sanasi" type="date" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="endDate" v-bind="endDateProps" label="Tugash sanasi" type="date" :disabled="isDisabledForm" />
          </VCol>

          <VCol cols="12">
            <label class="text-body-2 font-weight-medium mb-1 d-block">Asosiy rasm</label>
            <FormUpload v-model="mainImage" name="mainImage" label="Rasm yuklash" upload-service-name="contests" :disabled="isDisabledForm" />
          </VCol>

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
        <h3>Tanlovni o'chirish</h3>
      </template>
      <template #body>
        Haqiqatan ham bu tanlovni o'chirmoqchimisiz?
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
