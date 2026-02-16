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
const isActive = ref(true)

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'To\'liq ism', key: 'fullName', sortable: false },
  { title: 'Lavozim', key: 'position', sortable: false },
  { title: 'Telefon', key: 'phone', sortable: false },
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
    fullName: { uz: '', ru: '', en: '' },
    position: { uz: '', ru: '', en: '' },
    bio: { uz: '', ru: '', en: '' },
    photo: null,
    reception: '',
    phone: '',
    order: 1,
  },
  validationSchema: toTypedSchema(yup.object({
    fullName: multiLangObj(),
    position: multiLangObj(),
    bio: multiLangObj(),
    photo: yup.number().required('Majburiy maydon'),
    reception: yup.string().required('Majburiy maydon'),
    phone: yup.string().required('Majburiy maydon'),
    order: yup.number().required('Majburiy maydon').default(1),
  })),
})

const modalForm = {
  fullName: {
    uz: defineComponentBinds('fullName.uz'),
    ru: defineComponentBinds('fullName.ru'),
    en: defineComponentBinds('fullName.en'),
  },
  position: {
    uz: defineComponentBinds('position.uz'),
    ru: defineComponentBinds('position.ru'),
    en: defineComponentBinds('position.en'),
  },
  bio: {
    uz: defineComponentBinds('bio.uz'),
    ru: defineComponentBinds('bio.ru'),
    en: defineComponentBinds('bio.en'),
  },
  photo: defineComponentBinds('photo'),
  reception: defineComponentBinds('reception'),
  phone: defineComponentBinds('phone'),
  order: defineComponentBinds('order'),
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
    const r = data.result
    setValues({
      fullName: r.fullName || { uz: '', ru: '', en: '' },
      position: r.position || { uz: '', ru: '', en: '' },
      bio: r.bio || { uz: '', ru: '', en: '' },
      photo: r.photo ? (typeof r.photo === 'object' ? r.photo.id : r.photo) : null,
      reception: r.reception || '',
      phone: r.phone || '',
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
      await managementApi.update({ params: { id: itemID.value, ...payload } })
      snackbarText.value = "Ma'lumot muvaffaqiyatli yangilandi"
    } else {
      await managementApi.create({ params: payload })
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
        <template #item.fullName="{ item }">
          {{ getValueMatchLocale(item.raw.fullName) }}
        </template>

        <template #item.position="{ item }">
          {{ getValueMatchLocale(item.raw.position) }}
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
        <h3>{{ itemID ? (isDisabledForm ? 'Ko\'rish' : 'Tahrirlash') : 'Yangi yozuv' }}</h3>
      </template>
      <template #body>
        <VRow>
          <!-- Full Name -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.fullName.uz" label="To'liq ism (UZ)" :error-messages="errors['fullName.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.fullName.ru" label="To'liq ism (RU)" :error-messages="errors['fullName.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.fullName.en" label="To'liq ism (EN)" :error-messages="errors['fullName.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Position -->
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.position.uz" label="Lavozim (UZ)" :error-messages="errors['position.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.position.ru" label="Lavozim (RU)" :error-messages="errors['position.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-bind="modalForm.position.en" label="Lavozim (EN)" :error-messages="errors['position.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Bio -->
          <VCol cols="12">
            <VTextarea v-bind="modalForm.bio.uz" label="Biografiya (UZ)" :error-messages="errors['bio.uz']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.bio.ru" label="Biografiya (RU)" :error-messages="errors['bio.ru']" :disabled="isDisabledForm" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-bind="modalForm.bio.en" label="Biografiya (EN)" :error-messages="errors['bio.en']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Photo (Upload) -->
          <VCol cols="12">
            <FormUpload v-bind="modalForm.photo" name="photo" label="Rasm" upload-service-name="management" :disabled="isDisabledForm" />
            <span class="text-error text-caption">{{ errors['photo'] }}</span>
          </VCol>

          <!-- Reception -->
          <VCol cols="12" md="6">
            <VTextField v-bind="modalForm.reception" label="Qabul vaqti" placeholder="Dushanba-Juma 09:00-17:00" :error-messages="errors['reception']" :disabled="isDisabledForm" />
          </VCol>

          <!-- Phone -->
          <VCol cols="12" md="6">
            <VTextField v-bind="modalForm.phone" label="Telefon" placeholder="+998 65 221 00 00" :error-messages="errors['phone']" :disabled="isDisabledForm" />
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
