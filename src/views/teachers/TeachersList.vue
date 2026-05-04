<script setup>
import DeleteModal from '@/components/DeleteModal.vue'
import BasePagination from '@/components/pagination/BasePagination.vue'
import { useLoading } from '@/composable/useLoading'
import { teachersApi } from '@/services/teachers/teachers.service'
import { onMounted, ref } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

const { loading, startFetching, finishFetching } = useLoading()

const items = ref([])
const totalItems = ref(0)
const itemsPerPage = ref(10)
const currentPage = ref(1)

const isDeleteModal = ref(false)
const deleteId = ref(null)
const btnLoading = ref(false)
const isSnackbarVisible = ref(false)
const snackbarText = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Rasm', key: 'image', sortable: false },
  { title: 'Ismi', key: 'title', sortable: false },
  { title: 'Lavozim', key: 'position', sortable: false },
  { title: 'Fan', key: 'course', sortable: false },
  { title: 'Amallar', key: 'actions', sortable: false },
]

async function fetchItems() {
  startFetching()
  try {
    const { data } = await teachersApi.findAll({ params: { page: currentPage.value, limit: itemsPerPage.value } })
    items.value = data.result
    totalItems.value = data.meta?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    finishFetching()
  }
}

function openDeleteModal(id) {
  deleteId.value = id
  isDeleteModal.value = true
}

function closeDeleteModal() {
  isDeleteModal.value = false
  deleteId.value = null
}

async function deleteItem() {
  btnLoading.value = true
  try {
    await teachersApi.remove({ params: { id: deleteId.value } })
    snackbarText.value = "O'qituvchi o'chirildi"
    isSnackbarVisible.value = true
    closeDeleteModal()
    fetchItems()
  } catch (e) {
    console.error(e)
  } finally {
    btnLoading.value = false
  }
}

onMounted(fetchItems)
</script>

<template>
  <section>
    <VCard>
      <VCardText class="d-flex justify-space-between align-center">
        <h2 class="text-h4">O'qituvchilar</h2>
        <VBtn color="primary" prepend-icon="tabler-plus" :to="{ name: 'teachers-create' }">
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
        <template #item.image="{ item }">
          <div class="py-2">
            <VAvatar size="40" :image="item.raw.image || undefined" color="primary">
              <VIcon v-if="!item.raw.image" icon="tabler-user" />
            </VAvatar>
          </div>
        </template>

        <template #item.actions="{ item }">
          <IconBtn size="small" :to="{ name: 'teachers-edit', params: { id: item.raw.id } }">
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

    <DeleteModal v-model="isDeleteModal" @close-modal="closeDeleteModal">
      <template #header><h3>O'qituvchini o'chirish</h3></template>
      <template #body>Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?</template>
      <template #footer>
        <div class="d-flex justify-end gap-2 mt-4">
          <VBtn color="secondary" variant="tonal" @click="closeDeleteModal">Bekor qilish</VBtn>
          <VBtn color="error" :loading="btnLoading" @click="deleteItem">O'chirish</VBtn>
        </div>
      </template>
    </DeleteModal>

    <VSnackbar v-model="isSnackbarVisible" color="success">{{ snackbarText }}</VSnackbar>
  </section>
</template>
