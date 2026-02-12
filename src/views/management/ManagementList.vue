<script setup>
import { useLoading } from "@/composable/useLoading"
import { managementApi } from "@/services/management/management.service"
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

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Ism Familiya', key: 'full_name', sortable: false },
  { title: 'Lavozim', key: 'position', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

const { values, defineComponentBinds, handleSubmit, resetForm, setValues, errors } = useForm({
  validationSchema: toTypedSchema(yup.object({
    first_name: yup.string().required('Majburiy maydon'),
    last_name: yup.string().required('Majburiy maydon'),
    work_time: yup.string().required('Majburiy maydon'),
    position: yup.object({
      uz: yup.string().required('Majburiy maydon'),
      ru: yup.string().required('Majburiy maydon'),
      en: yup.string().required('Majburiy maydon'),
    }),
    text: yup.object({
      uz: yup.string().required('Majburiy maydon'),
      ru: yup.string().required('Majburiy maydon'),
      en: yup.string().required('Majburiy maydon'),
    }),
    image_id: yup.number().required('Majburiy maydon'),
  })),
})

const modalForm = {
  first_name: defineComponentBinds('first_name'),
  last_name: defineComponentBinds('last_name'),
  work_time: defineComponentBinds('work_time'),
  position: {
    uz: defineComponentBinds('position.uz'),
    ru: defineComponentBinds('position.ru'),
    en: defineComponentBinds('position.en'),
  },
  text: {
    uz: defineComponentBinds('text.uz'),
    ru: defineComponentBinds('text.ru'),
    en: defineComponentBinds('text.en'),
  },
  image_id: defineComponentBinds('image_id'),
}

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
    setValues({
      first_name: data.result.first_name,
      last_name: data.result.last_name,
      work_time: data.result.work_time,
      position: data.result.position,
      text: data.result.text,
      image_id: data.result.image ? data.result.image.id : null,
    })
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
    if (itemID.value) {
      await managementApi.update({ params: { id: itemID.value, ...formValues } })
      snackbarText.value = "Ma'lumot muvaffaqiyatli yangilandi"
    } else {
      await managementApi.create({ params: formValues })
      snackbarText.value = "Ma'lumot muvaffaqiyatli yaratildi"
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
    snackbarText.value = "Ma'lumot muvaffaqiyatli o'chirildi"
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
        <template #item.full_name="{ item }">
          {{ item.raw.first_name }} {{ item.raw.last_name }}
        </template>

        <template #item.position="{ item }">
          {{ getValueMatchLocale(item.raw.position) }}
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Yangi yozuv' }}</h3>
      </template>
      <template #body>
        <VRow>
          <VCol cols="12" md="6">
            <VTextField v-bind="modalForm.first_name" label="Ism" :error-messages="errors['first_name']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-bind="modalForm.last_name" label="Familiya" :error-messages="errors['last_name']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-bind="modalForm.work_time" label="Ish vaqti" :error-messages="errors['work_time']" :disabled="isDisabledForm" />
          </VCol>

          <VCol cols="12">
            <VTextField v-bind="modalForm.position.uz" label="Lavozim (UZ)" :error-messages="errors['position.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-bind="modalForm.position.ru" label="Lavozim (RU)" :error-messages="errors['position.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-bind="modalForm.position.en" label="Lavozim (EN)" :error-messages="errors['position.en']" :disabled="isDisabledForm" />
          </VCol>

          <VCol cols="12">
            <VTextarea v-bind="modalForm.text.uz" label="Matn (UZ)" :error-messages="errors['text.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.text.ru" label="Matn (RU)" :error-messages="errors['text.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.text.en" label="Matn (EN)" :error-messages="errors['text.en']" :disabled="isDisabledForm" />
          </VCol>

          <VCol cols="12">
            <FormUpload v-bind="modalForm.image_id" name="image" label="Rasm" upload-service-name="management" :disabled="isDisabledForm" />
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
