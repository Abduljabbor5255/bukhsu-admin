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
  { title: 'Nomi', key: 'name', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

const { values, defineComponentBinds, handleSubmit, resetForm, setValues, errors } = useForm({
  validationSchema: toTypedSchema(yup.object({
    name: yup.object({
      uz: yup.string().required('Majburiy maydon'),
      ru: yup.string().required('Majburiy maydon'),
      en: yup.string().required('Majburiy maydon'),
    }),
  })),
})

const modalForm = {
  name: {
    uz: defineComponentBinds('name.uz'),
    ru: defineComponentBinds('name.ru'),
    en: defineComponentBinds('name.en'),
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
    setValues({
      name: data.result.name,
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
      await toursApi.update({ params: { id: itemID.value, ...formValues } })
      snackbarText.value = "Tur muvaffaqiyatli yangilandi"
    } else {
      await toursApi.create({ params: formValues })
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
        <template #item.name="{ item }">
          {{ getValueMatchLocale(item.raw.name) }}
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
          <VCol cols="12">
            <VTextField v-bind="modalForm.name.uz" label="Nomi (UZ)" :error-messages="errors['name.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-bind="modalForm.name.ru" label="Nomi (RU)" :error-messages="errors['name.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextField v-bind="modalForm.name.en" label="Nomi (EN)" :error-messages="errors['name.en']" :disabled="isDisabledForm" />
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
