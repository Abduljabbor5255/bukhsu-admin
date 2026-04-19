<script setup>
import DeleteModal from '@/components/DeleteModal.vue'
import BasePagination from '@/components/pagination/BasePagination.vue'
import { useLoading } from '@/composable/useLoading'
import { newsApi } from '@/services/news/news.service'
import { onMounted, ref, watch } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

const { loading, startFetching, finishFetching } = useLoading()

const items        = ref([])
const totalItems   = ref(0)
const itemsPerPage = ref(10)
const currentPage  = ref(1)
const searchQuery  = ref('')
const filterCat    = ref('')
const filterStatus = ref('')

const isDeleteModal      = ref(false)
const deleteId           = ref(null)
const btnLoading         = ref(false)
const isSnackbarVisible  = ref(false)
const snackbarText       = ref('')

const CATEGORIES = ['Tadbir', "E'lon", 'Ilmiy', 'Xalqaro', 'Umumiy']

const headers = [
  { title: 'Rasm',      key: 'image',       sortable: false, width: 72 },
  { title: 'Sarlavha',  key: 'title',       sortable: false },
  { title: 'Kategoriya',key: 'categories',  sortable: false },
  { title: 'Muallif',   key: 'author',      sortable: false },
  { title: 'Status',    key: 'draft',       sortable: false },
  { title: 'Sana',      key: 'publishedAt', sortable: false },
  { title: 'Ko\'rishlar', key: 'views',     sortable: false },
  { title: 'Amallar',   key: 'actions',     sortable: false, width: 120 },
]

async function fetchItems() {
  startFetching()
  try {
    const { data } = await newsApi.findAll({
      page:       currentPage.value,
      limit:      itemsPerPage.value,
      search:     searchQuery.value || undefined,
      category:   filterCat.value   || undefined,
      draft:      filterStatus.value === 'draft'      ? true
                : filterStatus.value === 'published'  ? false
                : undefined,
    })
    items.value      = data.result  ?? data.data  ?? []
    totalItems.value = data.meta?.total ?? data.total ?? 0
  } catch (e) {
    console.error(e)
  } finally {
    finishFetching()
  }
}

let searchTimer = null
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchItems() }, 350)
})
watch([filterCat, filterStatus], () => { currentPage.value = 1; fetchItems() })

function openDeleteModal(id) { deleteId.value = id; isDeleteModal.value = true }
function closeDeleteModal()  { isDeleteModal.value = false; deleteId.value = null }

async function deleteItem() {
  btnLoading.value = true
  try {
    await newsApi.remove({ params: { id: deleteId.value } })
    snackbarText.value      = "Yangilik o'chirildi"
    isSnackbarVisible.value = true
    closeDeleteModal()
    fetchItems()
  } catch (e) {
    console.error(e)
  } finally {
    btnLoading.value = false
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(fetchItems)
</script>

<template>
  <section>
    <VCard>
      <!-- Top bar -->
      <VCardText class="d-flex flex-wrap align-center gap-3 pb-2">
        <h2 class="text-h5 font-weight-bold mr-auto">Yangiliklar</h2>

        <!-- Search -->
        <VTextField
          v-model="searchQuery"
          placeholder="Qidirish..."
          prepend-inner-icon="tabler-search"
          density="compact"
          hide-details
          style="max-width: 220px"
          clearable
        />

        <!-- Category filter -->
        <VSelect
          v-model="filterCat"
          :items="['', ...CATEGORIES]"
          placeholder="Kategoriya"
          density="compact"
          hide-details
          style="max-width: 160px"
          clearable
        />

        <!-- Status filter -->
        <VSelect
          v-model="filterStatus"
          :items="[
            { title: 'Barchasi', value: '' },
            { title: 'Nashr',    value: 'published' },
            { title: 'Qoralama', value: 'draft' },
          ]"
          item-title="title"
          item-value="value"
          density="compact"
          hide-details
          style="max-width: 140px"
        />

        <VBtn color="primary" prepend-icon="tabler-plus" :to="{ name: 'news-create' }">
          Yangi yangilik
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTableServer
        :items="items"
        :items-length="totalItems"
        :headers="headers"
        :loading="loading"
        class="text-no-wrap"
      >
        <!-- Cover image -->
        <template #item.image="{ item }">
          <div class="py-1">
            <VImg
              v-if="item.raw.image"
              :src="item.raw.image"
              width="64"
              height="44"
              cover
              class="rounded"
              style="min-width:64px"
            >
              <template #error>
                <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3 rounded">
                  <VIcon icon="tabler-photo-off" size="18" color="grey-darken-1" />
                </div>
              </template>
            </VImg>
            <div
              v-else
              class="d-flex align-center justify-center rounded bg-grey-lighten-3"
              style="width:64px;height:44px"
            >
              <VIcon icon="tabler-photo" size="18" color="grey-darken-1" />
            </div>
          </div>
        </template>

        <!-- Title + excerpt tooltip -->
        <template #item.title="{ item }">
          <div style="max-width: 280px">
            <VTooltip :text="item.raw.description || item.raw.title" location="top">
              <template #activator="{ props }">
                <span v-bind="props" class="d-block text-truncate font-weight-medium">
                  {{ item.raw.title }}
                </span>
              </template>
            </VTooltip>
            <span v-if="item.raw.featured" class="text-caption text-warning d-flex align-center gap-1 mt-1">
              <VIcon icon="tabler-star-filled" size="12" color="warning" />
              Featured
            </span>
          </div>
        </template>

        <!-- Category badge -->
        <template #item.categories="{ item }">
          <VChip
            v-if="item.raw.categories?.length"
            size="x-small"
            color="success"
            variant="tonal"
          >
            {{ item.raw.categories[0] }}
          </VChip>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Author -->
        <template #item.author="{ item }">
          <span class="text-body-2">{{ item.raw.author || '—' }}</span>
        </template>

        <!-- Status badge -->
        <template #item.draft="{ item }">
          <VChip
            :color="item.raw.draft ? 'default' : 'success'"
            size="x-small"
            variant="tonal"
          >
            {{ item.raw.draft ? 'Qoralama' : 'Nashr' }}
          </VChip>
        </template>

        <!-- Date -->
        <template #item.publishedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.raw.publishedAt) }}</span>
        </template>

        <!-- Views -->
        <template #item.views="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ (item.raw.views ?? 0).toLocaleString() }}</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-1">
            <VTooltip text="Tahrirlash" location="top">
              <template #activator="{ props }">
                <IconBtn v-bind="props" size="small" :to="{ name: 'news-edit', params: { id: item.raw._id ?? item.raw.id } }">
                  <VIcon icon="tabler-edit" />
                </IconBtn>
              </template>
            </VTooltip>

            <VTooltip text="Saytda ko'rish" location="top">
              <template #activator="{ props }">
                <IconBtn
                  v-bind="props"
                  size="small"
                  color="secondary"
                  :href="`/news/${item.raw.slug}`"
                  target="_blank"
                  tag="a"
                >
                  <VIcon icon="tabler-external-link" />
                </IconBtn>
              </template>
            </VTooltip>

            <VTooltip text="O'chirish" location="top">
              <template #activator="{ props }">
                <IconBtn v-bind="props" size="small" color="error" @click="openDeleteModal(item.raw._id ?? item.raw.id)">
                  <VIcon icon="tabler-trash" />
                </IconBtn>
              </template>
            </VTooltip>
          </div>
        </template>

        <!-- Pagination -->
        <template #bottom>
          <div class="d-flex justify-center align-center pa-4 gap-4">
            <span class="text-caption text-medium-emphasis">
              Jami: {{ totalItems }} ta
            </span>
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

    <!-- Delete modal -->
    <DeleteModal v-model="isDeleteModal" @close-modal="closeDeleteModal">
      <template #header><h3>Yangilikni o'chirish</h3></template>
      <template #body>Haqiqatan ham bu yangilikni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.</template>
      <template #footer>
        <div class="d-flex justify-end gap-2 mt-4">
          <VBtn color="secondary" variant="tonal" @click="closeDeleteModal">Bekor qilish</VBtn>
          <VBtn color="error" :loading="btnLoading" @click="deleteItem">O'chirish</VBtn>
        </div>
      </template>
    </DeleteModal>

    <VSnackbar v-model="isSnackbarVisible" color="success" :timeout="3000">
      <VIcon icon="tabler-check" class="me-2" />
      {{ snackbarText }}
    </VSnackbar>
  </section>
</template>
