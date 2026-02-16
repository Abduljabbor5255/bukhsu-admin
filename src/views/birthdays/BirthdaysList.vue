<script setup>
import { useLoading } from "@/composable/useLoading"
import { birthdaysApi } from "@/services/birthdays/birthdays.service"
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
const isActive = ref(true)

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Ism', key: 'name', sortable: false },
  { title: 'Lavozim', key: 'role', sortable: false },
  { title: 'Tug\'ilgan sana', key: 'birthDate', sortable: false },
  { title: 'Holat', key: 'isActive', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

const multiLangObj = () => yup.object({
  uz: yup.string().required('Majburiy maydon'),
  ru: yup.string().required('Majburiy maydon'),
  en: yup.string().required('Majburiy maydon'),
})

const { values, defineComponentBinds, handleSubmit, resetForm, setValues, errors } = useForm({
  initialValues: {
    name: { uz: '', ru: '', en: '' },
    role: { uz: '', ru: '', en: '' },
    image: null,
    birthDate: '',
    message: { uz: '', ru: '', en: '' },
  },
  validationSchema: toTypedSchema(yup.object({
    name: multiLangObj(),
    role: multiLangObj(),
    image: yup.number().required('Majburiy maydon'),
    birthDate: yup.string().required('Majburiy maydon'),
    message: multiLangObj(),
  })),
})

const modalForm = {
  name: {
    uz: defineComponentBinds('name.uz'),
    ru: defineComponentBinds('name.ru'),
    en: defineComponentBinds('name.en'),
  },
  role: {
    uz: defineComponentBinds('role.uz'),
    ru: defineComponentBinds('role.ru'),
    en: defineComponentBinds('role.en'),
  },
  image: defineComponentBinds('image'),
  birthDate: defineComponentBinds('birthDate'),
  message: {
    uz: defineComponentBinds('message.uz'),
    ru: defineComponentBinds('message.ru'),
    en: defineComponentBinds('message.en'),
  },
}

async function fetchItems() {
  startFetching()
  try {
    const { data } = await birthdaysApi.findAll({
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
    const { data } = await birthdaysApi.findOne({ params: { id } })
    const r = data.result
    setValues({
      name: r.name || { uz: '', ru: '', en: '' },
      role: r.role || { uz: '', ru: '', en: '' },
      image: r.image ? (typeof r.image === 'object' ? r.image.id : r.image) : null,
      birthDate: r.birthDate || '',
      message: r.message || { uz: '', ru: '', en: '' },
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
      ...formValues,
      isActive: isActive.value,
    }
    if (itemID.value) {
      await birthdaysApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Tug'ilgan kun muvaffaqiyatli yangilandi"
    } else {
      await birthdaysApi.create({ params: payload })
      snackbarText.value = "Tug'ilgan kun muvaffaqiyatli yaratildi"
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
    await birthdaysApi.remove({ params: { id: itemID.value } })
    snackbarText.value = "Tug'ilgan kun muvaffaqiyatli o'chirildi"
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
        <h2 class="text-h4">Tug'ilgan kunlar</h2>
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Tug\'ilgan kun yaratish' }}</h3>
      </template>
      <template #body>
        <VRow>
          <!-- Name -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.name.uz" label="Ism (UZ)" :error-messages="errors['name.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.name.ru" label="Ism (RU)" :error-messages="errors['name.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.name.en" label="Ism (EN)" :error-messages="errors['name.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Role -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.role.uz" label="Lavozim (UZ)" :error-messages="errors['role.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.role.ru" label="Lavozim (RU)" :error-messages="errors['role.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.role.en" label="Lavozim (EN)" :error-messages="errors['role.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Image (Upload) -->
          <VCol cols="12">
            <FormUpload v-bind="modalForm.image" name="image" label="Rasm" upload-service-name="birthdays" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['image'] }}</span>
          </VCol>

          <!-- Birth Date -->
          <VCol cols="12" md="6">
            <VTextField v-bind="modalForm.birthDate" label="Tug'ilgan sana" placeholder="1990-05-15" :error-messages="errors['birthDate']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Is Active -->
          <VCol cols="12" md="6">
            <VSwitch v-model="isActive" label="Faolmi?" :disabled="isDisabledForm" />
          </VCol>

          <!-- Message -->
          <VCol cols="12">
            <VTextarea v-bind="modalForm.message.uz" label="Tabrik xabari (UZ)" :error-messages="errors['message.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.message.ru" label="Tabrik xabari (RU)" :error-messages="errors['message.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.message.en" label="Tabrik xabari (EN)" :error-messages="errors['message.en']" :disabled="isDisabledForm" />
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
        <h3>Tug'ilgan kunni o'chirish</h3>
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
