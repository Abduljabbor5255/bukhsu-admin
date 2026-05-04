<script setup>
import { chatApi } from '@/services/chat/chat.service'
import { nextTick, onMounted, onUnmounted, ref, computed } from 'vue'

// ── Tabs ──────────────────────────────────────────────────────────
const tab = ref('inbox') // 'inbox' | 'users'

// ── Users tab ─────────────────────────────────────────────────────
const users        = ref([])
const usersLoading = ref(false)
const userSearch   = ref('')

const userHeaders = [
  { title: '#',               key: 'index',     sortable: false, width: 52 },
  { title: 'Foydalanuvchi',   key: 'user',      sortable: false           },
  { title: 'Username',        key: 'username',   sortable: true            },
  { title: 'Holat',           key: 'status',     sortable: false, width: 120 },
  { title: 'Ro\'yxatdan o\'tgan', key: 'createdAt', sortable: true        },
]

function isOnline(u) {
  if (!u.sessionToken || !u.sessionExpiresAt) return false
  return new Date(u.sessionExpiresAt) > new Date()
}

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.displayName?.toLowerCase().includes(q) ||
    u.username?.toLowerCase().includes(q)
  )
})

const onlineCount  = computed(() => users.value.filter(isOnline).length)

async function fetchUsers() {
  usersLoading.value = true
  try {
    const { data } = await chatApi.getUsers()
    users.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    usersLoading.value = false
  }
}

// ── Inbox tab ─────────────────────────────────────────────────────
const threads        = ref([])
const threadsLoading = ref(false)
const activeThread   = ref(null)
const messages       = ref([])
const msgsLoading    = ref(false)
const replyText      = ref('')
const replySending   = ref(false)
const msgsContainer  = ref(null)

const threadHeaders = [
  { title: 'Foydalanuvchi',  key: 'user',         sortable: false },
  { title: 'So\'nggi xabar', key: 'lastMessage',   sortable: false },
  { title: 'Xabarlar',       key: 'messageCount',  sortable: true, width: 100 },
  { title: 'Javob',          key: 'hasOwnerReply', sortable: false, width: 100 },
  { title: 'Yangilangan',    key: 'updatedAt',     sortable: true  },
  { title: '',               key: 'actions',       sortable: false, width: 80  },
]

async function fetchThreads() {
  threadsLoading.value = true
  try {
    const { data } = await chatApi.getThreads()
    threads.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    threadsLoading.value = false
  }
}

async function openThread(thread) {
  activeThread.value = thread
  messages.value     = []
  msgsLoading.value  = true
  try {
    const { data } = await chatApi.getMessages(thread.id)
    messages.value = Array.isArray(data) ? data : []
    await nextTick()
    scrollToBottom()
  } catch (e) {
    console.error(e)
  } finally {
    msgsLoading.value = false
  }
}

function scrollToBottom() {
  if (msgsContainer.value) {
    msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight
  }
}

async function sendReply() {
  if (!replyText.value.trim() || !activeThread.value) return
  replySending.value = true
  try {
    const { data } = await chatApi.reply(activeThread.value.id, replyText.value.trim())
    messages.value = Array.isArray(data) ? data : messages.value
    replyText.value = ''
    await nextTick()
    scrollToBottom()
    // Update thread list
    fetchThreads()
  } catch (e) {
    console.error(e)
  } finally {
    replySending.value = false
  }
}

function onReplyKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendReply()
  }
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

function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch { return '' }
}

// ── Init & polling ────────────────────────────────────────────────
let pollInterval = null

onMounted(() => {
  fetchUsers()
  fetchThreads()
  pollInterval = setInterval(() => {
    if (tab.value === 'inbox') {
      fetchThreads()
      if (activeThread.value) openThread(activeThread.value)
    }
  }, 8000)
})

onUnmounted(() => clearInterval(pollInterval))
</script>

<template>
  <section>
    <!-- Stat cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar color="primary" variant="tonal" size="42">
              <VIcon icon="tabler-users" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ users.length }}</div>
              <div class="text-caption">Jami foydalanuvchi</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar color="success" variant="tonal" size="42">
              <VIcon icon="tabler-message" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ threads.length }}</div>
              <div class="text-caption">Faol suhbat</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar color="warning" variant="tonal" size="42">
              <VIcon icon="tabler-message-exclamation" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ threads.filter(t => !t.hasOwnerReply).length }}
              </div>
              <div class="text-caption">Javob kutilmoqda</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabs -->
    <VCard>
      <VTabs v-model="tab" color="primary">
        <VTab value="inbox">
          <VIcon start icon="tabler-inbox" />
          Xabarlar
          <VBadge
            v-if="threads.filter(t => !t.hasOwnerReply).length"
            :content="threads.filter(t => !t.hasOwnerReply).length"
            color="warning"
            class="ml-2"
          />
        </VTab>
        <VTab value="users">
          <VIcon start icon="tabler-users" />
          Foydalanuvchilar
        </VTab>
      </VTabs>

      <VDivider />

      <!-- ── INBOX TAB ── -->
      <VTabsWindow v-model="tab">
        <VTabsWindowItem value="inbox">
          <div class="d-flex" style="min-height: 540px;">

            <!-- Thread list -->
            <div style="width:340px; border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); overflow-y:auto; flex-shrink:0;">
              <div class="pa-3 d-flex align-center justify-space-between">
                <span class="text-subtitle-2 font-weight-bold">Suhbatlar</span>
                <VBtn icon variant="text" size="small" @click="fetchThreads" :loading="threadsLoading">
                  <VIcon icon="tabler-refresh" size="18" />
                </VBtn>
              </div>
              <VDivider />

              <div v-if="threadsLoading && threads.length === 0" class="pa-4">
                <VSkeletonLoader type="list-item-avatar-three-line" v-for="i in 3" :key="i" />
              </div>

              <div v-else-if="threads.length === 0" class="d-flex flex-column align-center pa-6 text-medium-emphasis">
                <VIcon icon="tabler-message-off" size="40" class="mb-2" />
                <span class="text-caption">Hali xabar yo'q</span>
              </div>

              <VList v-else lines="two" density="compact" class="pa-0">
                <VListItem
                  v-for="thread in threads"
                  :key="thread.id"
                  :active="activeThread?.id === thread.id"
                  active-color="primary"
                  @click="openThread(thread)"
                  class="py-3 cursor-pointer"
                >
                  <template #prepend>
                    <VAvatar color="primary" size="38">
                      <span class="text-body-2 font-weight-bold">
                        {{ (thread.user?.displayName || thread.visitorName || '?')[0].toUpperCase() }}
                      </span>
                    </VAvatar>
                  </template>

                  <VListItemTitle class="font-weight-semibold text-body-2">
                    {{ thread.user?.displayName || thread.visitorName }}
                    <VChip
                      v-if="!thread.hasOwnerReply"
                      size="x-small"
                      color="warning"
                      class="ml-1"
                    >yangi</VChip>
                  </VListItemTitle>
                  <VListItemSubtitle class="text-caption">
                    {{ thread.lastMessage }}
                  </VListItemSubtitle>

                  <template #append>
                    <div class="text-caption text-medium-emphasis" style="white-space:nowrap">
                      {{ formatTime(thread.updatedAt) }}
                    </div>
                  </template>
                </VListItem>
              </VList>
            </div>

            <!-- Message view -->
            <div class="flex-1 d-flex flex-column">
              <!-- No thread selected -->
              <div v-if="!activeThread" class="flex-1 d-flex flex-column align-center justify-center text-medium-emphasis gap-2">
                <VIcon icon="tabler-message-circle" size="52" />
                <span>Suhbatni tanlang</span>
              </div>

              <template v-else>
                <!-- Thread header -->
                <div class="pa-3 d-flex align-center gap-3 border-b">
                  <VAvatar color="primary" size="36">
                    <span class="font-weight-bold text-body-2">
                      {{ (activeThread.user?.displayName || activeThread.visitorName || '?')[0].toUpperCase() }}
                    </span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-semibold text-body-2">
                      {{ activeThread.user?.displayName || activeThread.visitorName }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      @{{ activeThread.user?.username || '—' }}
                    </div>
                  </div>
                </div>

                <!-- Messages -->
                <div ref="msgsContainer" class="flex-1 pa-4 overflow-y-auto" style="max-height:380px;">
                  <div v-if="msgsLoading" class="d-flex justify-center pa-4">
                    <VProgressCircular indeterminate color="primary" />
                  </div>
                  <div v-else-if="messages.length === 0" class="text-center text-medium-emphasis text-caption pa-4">
                    Hali xabar yo'q
                  </div>
                  <div v-else class="d-flex flex-column gap-2">
                    <div
                      v-for="msg in messages.filter(m => !m.deletedAt)"
                      :key="msg.id"
                      class="d-flex"
                      :class="msg.sender === 'owner' ? 'justify-end' : 'justify-start'"
                    >
                      <div
                        class="px-3 py-2 rounded-lg"
                        style="max-width:72%"
                        :class="msg.sender === 'owner'
                          ? 'bg-primary text-white'
                          : 'bg-surface-variant'"
                      >
                        <div v-if="msg.sender !== 'owner'" class="text-caption font-weight-bold mb-1 opacity-70">
                          {{ msg.author }}
                        </div>
                        <div class="text-body-2">{{ msg.text }}</div>
                        <div class="text-right text-caption opacity-60 mt-1" style="font-size:10px">
                          {{ formatTime(msg.createdAt) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Reply composer -->
                <div class="pa-3 border-t">
                  <div class="d-flex gap-2 align-end">
                    <VTextarea
                      v-model="replyText"
                      placeholder="Javob yozing... (Enter = yuborish, Shift+Enter = yangi qator)"
                      rows="2"
                      auto-grow
                      max-rows="4"
                      hide-details
                      density="compact"
                      variant="outlined"
                      @keydown="onReplyKeydown"
                      class="flex-1"
                    />
                    <VBtn
                      color="primary"
                      icon
                      :loading="replySending"
                      :disabled="!replyText.trim()"
                      @click="sendReply"
                    >
                      <VIcon icon="tabler-send" />
                    </VBtn>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </VTabsWindowItem>

        <!-- ── USERS TAB ── -->
        <VTabsWindowItem value="users">
          <VCardText class="d-flex justify-space-between align-center flex-wrap gap-3 pb-0">
            <div class="d-flex align-center gap-2">
              <span class="text-subtitle-1 font-weight-bold">Ro'yxatdan o'tganlar</span>
              <VChip size="small" color="primary" variant="tonal">{{ users.length }}</VChip>
              <VChip size="small" color="success" variant="tonal">{{ onlineCount }} online</VChip>
            </div>
            <VTextField
              v-model="userSearch"
              prepend-inner-icon="tabler-search"
              placeholder="Ism yoki username..."
              density="compact"
              variant="outlined"
              hide-details
              style="max-width:240px"
              clearable
            />
          </VCardText>

          <VDataTable
            :items="filteredUsers"
            :headers="userHeaders"
            :loading="usersLoading"
            items-per-page="20"
            class="text-no-wrap"
          >
            <template #item.index="{ index }">
              <span class="text-medium-emphasis">{{ index + 1 }}</span>
            </template>

            <template #item.user="{ item }">
              <div class="d-flex align-center gap-3 py-2">
                <VAvatar color="primary" size="36">
                  <span class="text-body-2 font-weight-bold">
                    {{ (item.raw.displayName || item.raw.username || '?')[0].toUpperCase() }}
                  </span>
                </VAvatar>
                <span class="font-weight-semibold">{{ item.raw.displayName || item.raw.username }}</span>
              </div>
            </template>

            <template #item.username="{ item }">
              <code class="text-caption">@{{ item.raw.username }}</code>
            </template>

            <template #item.status="{ item }">
              <VChip
                :color="isOnline(item.raw) ? 'success' : 'secondary'"
                size="small"
                variant="tonal"
                :prepend-icon="isOnline(item.raw) ? 'tabler-point-filled' : 'tabler-point'"
              >{{ isOnline(item.raw) ? 'Online' : 'Offline' }}</VChip>
            </template>

            <template #item.createdAt="{ item }">
              <span class="text-caption text-medium-emphasis">{{ formatDate(item.raw.createdAt) }}</span>
            </template>

            <template #no-data>
              <div class="d-flex flex-column align-center py-8 gap-2">
                <VIcon icon="tabler-user-off" size="44" color="secondary" />
                <span class="text-body-2 text-medium-emphasis">Foydalanuvchi yo'q</span>
              </div>
            </template>
          </VDataTable>
        </VTabsWindowItem>
      </VTabsWindow>
    </VCard>
  </section>
</template>
