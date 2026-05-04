<script setup>
import { chatApi } from '@/services/chat/chat.service'
import { onMounted, ref, computed } from 'vue'

const items   = ref([])
const loading = ref(false)
const search  = ref('')

const headers = [
  { title: '#',           key: 'index',     sortable: false, width: 56   },
  { title: 'Foydalanuvchi', key: 'user',   sortable: false               },
  { title: 'Username',   key: 'username',   sortable: true                },
  { title: 'Holat',      key: 'status',     sortable: false, width: 130  },
  { title: 'Ro\'yxatdan o\'tgan', key: 'createdAt', sortable: true       },
]

function isOnline(user) {
  if (!user.sessionToken || !user.sessionExpiresAt) return false
  return new Date(user.sessionExpiresAt) > new Date()
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch { return iso }
}

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(u =>
    u.displayName?.toLowerCase().includes(q) ||
    u.username?.toLowerCase().includes(q)
  )
})

const onlineCount  = computed(() => items.value.filter(isOnline).length)
const offlineCount = computed(() => items.value.length - onlineCount.value)

async function fetchItems() {
  loading.value = true
  try {
    const { data } = await chatApi.getUsers()
    items.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Chat users fetch error:', e)
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchItems)
</script>

<template>
  <section>
    <!-- Stats -->
    <VRow class="mb-4">
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar color="primary" variant="tonal" size="42">
              <VIcon icon="tabler-users" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ items.length }}</div>
              <div class="text-caption text-medium-emphasis">Jami foydalanuvchi</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar color="success" variant="tonal" size="42">
              <VIcon icon="tabler-wifi" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ onlineCount }}</div>
              <div class="text-caption text-medium-emphasis">Online</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar color="secondary" variant="tonal" size="42">
              <VIcon icon="tabler-wifi-off" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ offlineCount }}</div>
              <div class="text-caption text-medium-emphasis">Offline</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Table -->
    <VCard>
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-3">
        <h2 class="text-h5">Chat foydalanuvchilari</h2>
        <VTextField
          v-model="search"
          prepend-inner-icon="tabler-search"
          placeholder="Ism yoki username..."
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 260px"
          clearable
        />
      </VCardText>

      <VDivider />

      <VDataTable
        :items="filteredItems"
        :headers="headers"
        :loading="loading"
        items-per-page="20"
        class="text-no-wrap"
      >
        <!-- Index -->
        <template #item.index="{ index }">
          <span class="text-medium-emphasis">{{ index + 1 }}</span>
        </template>

        <!-- User avatar + name -->
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <VAvatar color="primary" size="36">
              <span class="text-body-2 font-weight-bold">
                {{ (item.raw.displayName || item.raw.username || '?')[0].toUpperCase() }}
              </span>
            </VAvatar>
            <div>
              <div class="font-weight-semibold">
                {{ item.raw.displayName || item.raw.username }}
              </div>
            </div>
          </div>
        </template>

        <!-- Username -->
        <template #item.username="{ item }">
          <code class="text-caption">@{{ item.raw.username }}</code>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VChip
            :color="isOnline(item.raw) ? 'success' : 'secondary'"
            size="small"
            variant="tonal"
            :prepend-icon="isOnline(item.raw) ? 'tabler-point-filled' : 'tabler-point'"
          >
            {{ isOnline(item.raw) ? 'Online' : 'Offline' }}
          </VChip>
        </template>

        <!-- Date -->
        <template #item.createdAt="{ item }">
          <span class="text-medium-emphasis text-caption">
            {{ formatDate(item.raw.createdAt) }}
          </span>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="d-flex flex-column align-center py-8 gap-3">
            <VIcon icon="tabler-message-off" size="48" color="secondary" />
            <span class="text-body-2 text-medium-emphasis">
              Hali ro'yxatdan o'tgan foydalanuvchi yo'q
            </span>
          </div>
        </template>
      </VDataTable>
    </VCard>
  </section>
</template>
