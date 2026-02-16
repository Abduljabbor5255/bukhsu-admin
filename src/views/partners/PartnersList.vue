<script setup>
import { useLoading } from "@/composable/useLoading"
import { partnersApi } from "@/services/partners/partners.service"
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
  { title: 'Nomi', key: 'alt', sortable: false },
  { title: 'Havola', key: 'link', sortable: false },
  { title: 'Tartib', key: 'order', sortable: false },
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
    image: null,
    alt: { uz: '', ru: '', en: '' },
    link: '',
    order: 1,
  },
  validationSchema: toTypedSchema(yup.object({
    image: yup.number().required('Majburiy maydon'),
    alt: multiLangObj(),
    link: yup.string().required('Majburiy maydon'),
    order: yup.number().required('Majburiy maydon').default(1),
  })),
})

const modalForm = {
  image: defineComponentBinds('image'),
  alt: {
    uz: defineComponentBinds('alt.uz'),
    ru: defineComponentBinds('alt.ru'),
    en: defineComponentBinds('alt.en'),
  },
  link: defineComponentBinds('link'),
  order: defineComponentBinds('order'),
}

async function fetchItems() {
  startFetching()
  try {
    const { data } = await partnersApi.findAll({
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
    const { data } = await partnersApi.findOne({ params: { id } })
    const r = data.result
    setValues({
      image: r.image ? (typeof r.image === 'object' ? r.image.id : r.image) : null,
      alt: r.alt || { uz: '', ru: '', en: '' },
      link: r.link || '',
      order: r.order || 1,
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
      await partnersApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Hamkor muvaffaqiyatli yangilandi"
    } else {
      await partnersApi.create({ params: payload })
      snackbarText.value = "Hamkor muvaffaqiyatli yaratildi"
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
    await partnersApi.remove({ params: { id: itemID.value } })
    snackbarText.value = "Hamkor muvaffaqiyatli o'chirildi"
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
        <h2 class="text-h4">Hamkorlar</h2>
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
        <template #item.alt="{ item }">
          {{ getValueMatchLocale(item.raw.alt) }}
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Hamkor yaratish' }}</h3>
      </template>
      <template #body>
        <VRow>
          <!-- Image (Upload) -->
          <VCol cols="12">
            <FormUpload v-bind="modalForm.image" name="image" label="Logo rasm" upload-service-name="partners" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['image'] }}</span>
          </VCol>

          <!-- Alt -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.alt.uz" label="Nomi (UZ)" :error-messages="errors['alt.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.alt.ru" label="Nomi (RU)" :error-messages="errors['alt.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.alt.en" label="Nomi (EN)" :error-messages="errors['alt.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Link -->
          <VCol cols="12">
            <VTextField v-bind="modalForm.link" label="Havola (URL)" placeholder="https://example.com" :error-messages="errors['link']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Order -->
          <VCol cols="12" md="6">
            <VTextField v-bind="modalForm.order" label="Tartib raqami" type="number" :error-messages="errors['order']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Is Active -->
          <VCol cols="12" md="6">
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
        <h3>Hamkorni o'chirish</h3>
      </template>
      <template #body>
        Haqiqatan ham bu hamkorni o'chirmoqchimisiz?
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
