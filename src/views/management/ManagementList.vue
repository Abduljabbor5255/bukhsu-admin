<script setup>
import { useLoading } from "@/composable/useLoading"
import { managementApi } from "@/services/management/management.service"
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
const isActive = ref(true)

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Ism', key: 'name', sortable: false },
  { title: 'Lavozim', key: 'role', sortable: false },
  { title: 'Tartib', key: 'order', sortable: false },
  { title: 'Holat', key: 'isActive', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

const multiLangObj = () => yup.object({
  uz: yup.string().required('Majburiy maydon'),
  ru: yup.string().required('Majburiy maydon'),
  en: yup.string().required('Majburiy maydon'),
})

const { values, handleSubmit, resetForm, setValues, errors } = useForm({
  initialValues: {
    name: { uz: '', ru: '', en: '' },
    role: { uz: '', ru: '', en: '' },
    image: null,
    order: 1,
    phone: '',
    reception: { uz: '', ru: '', en: '' },
  },
  validationSchema: toTypedSchema(yup.object({
    name: multiLangObj(),
    role: multiLangObj(),
    image: yup.mixed().required('Majburiy maydon'),
    order: yup.number().required('Majburiy maydon'),
    phone: yup.string().required('Majburiy maydon'),
    reception: multiLangObj(),
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

const name = makeLangFields('name')
const role = makeLangFields('role')
const reception = makeLangFields('reception')

const { value: image } = useField('image')

const { value: order, errorMessage: orderError, handleBlur: orderBlur } = useField('order')
const orderProps = computed(() => ({
  'error-messages': orderError.value,
  onBlur: orderBlur,
}))

const { value: phone, errorMessage: phoneError, handleBlur: phoneBlur } = useField('phone')
const phoneProps = computed(() => ({
  'error-messages': phoneError.value,
  onBlur: phoneBlur,
}))

async function fetchItems() {
  startFetching()
  try {
    const { data } = await managementApi.findAll({
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
    const { data } = await managementApi.findOne({ params: { id } })
    const r = data.result
    setValues({
      name: r.name || { uz: '', ru: '', en: '' },
      role: r.role || { uz: '', ru: '', en: '' },
      image: r.image ? (typeof r.image === 'object' ? r.image.id : r.image) : null,
      order: r.order || 1,
      phone: r.phone || '',
      reception: r.reception || { uz: '', ru: '', en: '' },
    })
    isActive.value = r.isActive !== undefined ? r.isActive : true
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
      fullName: formValues.name,
      position: formValues.role,
      reception: typeof formValues.reception === 'string' ? formValues.reception : JSON.stringify(formValues.reception),
      order: formValues.order,
      phone: formValues.phone,
      isActive: isActive.value,
      // bio is in DTO but not in form? form has 'reception'.
      // DTO has 'reception' as string.
      // DTO has 'photo'.
    }

    if (formValues.image) {
       payload.photo = formValues.image
    }

    if (itemID.value) {
      await managementApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Rahbariyat a'zosi muvaffaqiyatli yangilandi"
    } else {
      await managementApi.create({ params: payload })
      snackbarText.value = "Rahbariyat a'zosi muvaffaqiyatli yaratildi"
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
    await managementApi.remove({ params: { id: itemID.value } })
    snackbarText.value = "Rahbariyat a'zosi muvaffaqiyatli o'chirildi"
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
  isActive.value = true
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
        <h2 class="text-h4">Rahbariyat</h2>
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
        <template #item.name="{ item }">
          {{ getValueMatchLocale(item.raw.name) }}
        </template>

        <template #item.role="{ item }">
          {{ getValueMatchLocale(item.raw.role) }}
        </template>

        <template #item.isActive="{ item }">
          <VChip :color="item.raw.isActive ? 'success' : 'warning'" size="small">
            {{ item.raw.isActive ? 'Faol' : 'Nofaol' }}
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Rahbar yaratish' }}</h3>
      </template>
      <template #body>
        <VRow>
          <!-- Name -->
          <VCol cols="12" md="4">
            <VTextField v-model="name.uz" v-bind="name.uzProps" label="Ism (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="name.ru" v-bind="name.ruProps" label="Ism (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="name.en" v-bind="name.enProps" label="Ism (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Role -->
          <VCol cols="12" md="4">
            <VTextField v-model="role.uz" v-bind="role.uzProps" label="Lavozim (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="role.ru" v-bind="role.ruProps" label="Lavozim (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="role.en" v-bind="role.enProps" label="Lavozim (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Image (Upload) -->
          <VCol cols="12">
            <FormUpload v-model="image" name="image" label="Rasm" upload-service-name="management" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['image'] }}</span>
          </VCol>

          <!-- Order -->
          <VCol cols="12" md="6">
            <VTextField v-model="order" v-bind="orderProps" label="Tartib raqami" type="number" :disabled="isDisabledForm" />
          </VCol>

          <!-- Phone -->
          <VCol cols="12" md="6">
            <VTextField v-model="phone" v-bind="phoneProps" label="Telefon raqami" placeholder="+998 65 221 00 00" :disabled="isDisabledForm" />
          </VCol>

          <!-- Reception -->
          <VCol cols="12">
            <VTextarea v-model="reception.uz" v-bind="reception.uzProps" label="Qabul kunlari (UZ)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="reception.ru" v-bind="reception.ruProps" label="Qabul kunlari (RU)" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="reception.en" v-bind="reception.enProps" label="Qabul kunlari (EN)" :disabled="isDisabledForm" />
          </VCol>

          <!-- Is Active -->
          <VCol cols="12">
            <VSwitch v-model="isActive" label="Faolmi?" :disabled="isDisabledForm" />
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
        <h3>Yozuvni o'chirish</h3>
      </template>
      <template #body>
        Haqiqatan ham bu yozuvni o'chirmoqchimisiz?
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
