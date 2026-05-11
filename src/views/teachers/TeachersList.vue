<script setup>
import DeleteModal from '@/components/DeleteModal.vue'
import BasePagination from '@/components/pagination/BasePagination.vue'
import { useLoading } from '@/composable/useLoading'
import { teachersApi } from '@/services/teachers/teachers.service'
import { onMounted, ref } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

const { loading, startFetching, finishFetching } = useLoading()

const items        = ref([])
const totalItems   = ref(0)
const itemsPerPage = ref(10)
const currentPage  = ref(1)

const isDeleteModal    = ref(false)
const deleteId         = ref(null)
const btnLoading       = ref(false)
const isSnackbarVisible = ref(false)
const snackbarText     = ref('')

const headers = [
  { title: '#',        key: 'index',    sortable: false, width: 56 },
  { title: 'Rasm',     key: 'image',    sortable: false, width: 64 },
  { title: 'Ismi',     key: 'title',    sortable: false },
  { title: 'Lavozim',  key: 'position', sortable: false },
  { title: 'Fan',      key: 'course',   sortable: false },
  { title: 'Amallar',  key: 'actions',  sortable: false, width: 100, align: 'end' },
]

async function fetchItems() {
  startFetching()
  try {
    const { data } = await teachersApi.findAll({ params: { page: currentPage.value, limit: itemsPerPage.value } })
    items.value      = data.result ?? data.data ?? []
    totalItems.value = data.meta?.total ?? data.total ?? items.value.length
  } catch (e) {
    console.error(e)
  } finally {
    finishFetching()
  }
}

function openDeleteModal(id) {
  deleteId.value    = id
  isDeleteModal.value = true
}

function closeDeleteModal() {
  isDeleteModal.value = false
  deleteId.value      = null
}

async function deleteItem() {
  btnLoading.value = true
  try {
    await teachersApi.remove({ params: { id: deleteId.value } })
    snackbarText.value      = "O'qituvchi o'chirildi"
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
    <!-- Header -->
    <VCard class="mb-4" elevation="0" border>
      <VCardText class="py-4">
        <div class="d-flex align-center justify-space-between gap-3">
          <div>
            <h2 class="text-h6 font-weight-bold mb-0">O'qituvchilar</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              Jami: {{ totalItems }} ta o'qituvchi
            </p>
          </div>
          <VBtn color="primary" prepend-icon="tabler-plus" :to="{ name: 'teachers-create' }">
            Qo'shish
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <VCard elevation="0" border>
      <VDataTableServer
        :items="items"
        :items-length="totalItems"
        :headers="headers"
        :loading="loading"
        class="text-no-wrap"
      >
        <!-- Row number -->
        <template #item.index="{ index }">
          <span class="text-caption text-medium-emphasis">
            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- Avatar -->
        <template #item.image="{ item }">
          <div class="py-2">
            <VAvatar
              size="38"
              :image="(item.raw ?? item).image || undefined"
              color="primary"
              variant="tonal"
            >
              <VIcon v-if="!(item.raw ?? item).image" icon="tabler-user" size="18" />
            </VAvatar>
          </div>
        </template>

        <!-- Name -->
        <template #item.title="{ item }">
          <div class="py-1">
            <p class="text-body-2 font-weight-medium mb-0">{{ (item.raw ?? item).title || '—' }}</p>
            <p v-if="(item.raw ?? item).degree" class="text-caption text-medium-emphasis mb-0">
              {{ (item.raw ?? item).degree }}
            </p>
          </div>
        </template>

        <!-- Position -->
        <template #item.position="{ item }">
          <span class="text-body-2">{{ (item.raw ?? item).position || '—' }}</span>
        </template>

        <!-- Course -->
        <template #item.course="{ item }">
          <VChip
            v-if="(item.raw ?? item).course"
            size="x-small"
            variant="tonal"
            color="primary"
          >
            {{ (item.raw ?? item).course }}
          </VChip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-end">
            <IconBtn
              size="small"
              :to="{ name: 'teachers-edit', params: { id: (item.raw ?? item)._id || (item.raw ?? item).id } }"
            >
              <VIcon icon="tabler-edit" size="16" />
            </IconBtn>
            <IconBtn
              size="small"
              color="error"
              @click="openDeleteModal((item.raw ?? item)._id || (item.raw ?? item).id)"
            >
              <VIcon icon="tabler-trash" size="16" />
            </IconBtn>
          </div>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="d-flex flex-column align-center py-10 gap-3 text-medium-emphasis">
            <VIcon icon="tabler-users-group" size="48" opacity="0.3" />
            <div class="text-center">
              <p class="text-body-1 font-weight-medium mb-1">O'qituvchilar topilmadi</p>
              <p class="text-caption mb-0">Yangi o'qituvchi qo'shing</p>
            </div>
            <VBtn color="primary" size="small" prepend-icon="tabler-plus" :to="{ name: 'teachers-create' }">
              Qo'shish
            </VBtn>
          </div>
        </template>

        <!-- Pagination -->
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

    <VSnackbar v-model="isSnackbarVisible" color="success" location="bottom right">
      <div class="d-flex align-center gap-2">
        <VIcon icon="tabler-check" size="18" />
        {{ snackbarText }}
      </div>
    </VSnackbar>
  </section>
</template>
