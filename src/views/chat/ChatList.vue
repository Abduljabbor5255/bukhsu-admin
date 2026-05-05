<script setup>
import { chatApi } from '@/services/chat/chat.service'
import { nextTick, onMounted, onUnmounted, ref, computed } from 'vue'

const tab = ref('inbox')

// ── Responsive: track window width ───────────────────────────────
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const isMobile    = computed(() => windowWidth.value < 640)

function onResize() { windowWidth.value = window.innerWidth }

// ── Users ─────────────────────────────────────────────────────────
const users        = ref([])
const usersLoading = ref(false)
const userSearch   = ref('')


function isOnline(u) {
  return !!(u?.sessionToken && u?.sessionExpiresAt && new Date(u.sessionExpiresAt) > new Date())
}

const onlineCount = computed(() => users.value.filter(isOnline).length)

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    (u.displayName || '').toLowerCase().includes(q) ||
    (u.username   || '').toLowerCase().includes(q)
  )
})

async function fetchUsers() {
  usersLoading.value = true
  try {
    const { data } = await chatApi.getUsers()
    users.value = Array.isArray(data) ? data : []
  } catch { /* silent */ }
  finally { usersLoading.value = false }
}

// ── Inbox ─────────────────────────────────────────────────────────
const threads        = ref([])
const threadsLoading = ref(false)
const activeThread   = ref(null)
const messages       = ref([])
const msgsLoading    = ref(false)
const replyText      = ref('')
const replySending   = ref(false)
const sendError      = ref('')
const msgsContainer  = ref(null)
const textareaRef    = ref(null)

// Track which threads the admin has already opened (plain array — reactive)
const readThreadIds = ref([])

// Threads sorted by most recent first
const sortedThreads = computed(() =>
  [...threads.value].sort((a, b) =>
    new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  )
)

const unreadCount = computed(() =>
  threads.value.filter(t => !t.hasOwnerReply && !readThreadIds.value.includes(t.id)).length
)

async function fetchThreads() {
  threadsLoading.value = true
  try {
    const { data } = await chatApi.getThreads()
    threads.value = Array.isArray(data) ? data : []
  } catch { /* silent */ }
  finally { threadsLoading.value = false }
}

function goBackToList() { activeThread.value = null }

// Open thread — full load with loading indicator, scroll to bottom
async function openThread(thread) {
  activeThread.value = thread
  if (!readThreadIds.value.includes(thread.id))
    readThreadIds.value = [...readThreadIds.value, thread.id]
  messages.value    = []
  msgsLoading.value = true
  sendError.value   = ''
  try {
    const { data } = await chatApi.getMessages(thread.id)
    messages.value = Array.isArray(data) ? data : []
    await nextTick()
    scrollToBottom()
  } catch { /* silent */ }
  finally { msgsLoading.value = false }
}

// Silent refresh — only updates messages without resetting state or scroll
async function silentRefreshMessages() {
  if (!activeThread.value) return
  try {
    const { data } = await chatApi.getMessages(activeThread.value.id)
    const fresh = Array.isArray(data) ? data : []
    // Only update if new messages arrived to avoid unnecessary re-renders
    if (fresh.length !== messages.value.length) {
      const wasAtBottom = isNearBottom()
      messages.value = fresh
      if (wasAtBottom) { await nextTick(); scrollToBottom() }
    }
  } catch { /* silent poll failure */ }
}

function isNearBottom() {
  if (!msgsContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = msgsContainer.value
  return scrollHeight - scrollTop - clientHeight < 80
}

function scrollToBottom() {
  if (msgsContainer.value)
    msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight
}

async function sendReply() {
  const text = replyText.value.trim()
  if (!text || !activeThread.value || replySending.value) return

  replySending.value = true
  sendError.value    = ''

  // Optimistic: clear input immediately
  replyText.value = ''
  resetTextarea()

  try {
    const { data } = await chatApi.reply(activeThread.value.id, text)
    messages.value = Array.isArray(data) ? data : messages.value

    // Update thread list: mark as replied + bump updatedAt
    const idx = threads.value.findIndex(t => t.id === activeThread.value.id)
    if (idx !== -1) {
      threads.value[idx] = {
        ...threads.value[idx],
        hasOwnerReply: true,
        updatedAt: new Date().toISOString(),
        lastMessage: text,
      }
    }

    await nextTick(); scrollToBottom()
  } catch {
    sendError.value = "Xabar yuborilmadi. Qayta urinib ko'ring."
    // Restore text so user doesn't lose it
    replyText.value = text
  } finally {
    replySending.value = false
  }
}

function onReplyKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
}

// Auto-resize textarea as user types
function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetTextarea() {
  const el = textareaRef.value
  if (el) el.style.height = 'auto'
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

function initials(name) {
  return (name || '?')[0].toUpperCase()
}

// ── Polling + resize ──────────────────────────────────────────────
let poll = null
onMounted(() => {
  fetchUsers()
  fetchThreads()
  window.addEventListener('resize', onResize)
  poll = setInterval(async () => {
    if (tab.value !== 'inbox') return
    await fetchThreads()
    await silentRefreshMessages()
  }, 7000)
})
onUnmounted(() => {
  clearInterval(poll)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <section class="chat-page">
    <VCard class="chat-card">

      <!-- Tabs + inline stats -->
      <div class="chat-header">
        <VTabs v-model="tab" color="primary" density="compact" class="chat-tabs">
          <VTab value="inbox">
            <VIcon start icon="tabler-inbox" size="16" />
            Xabarlar
            <span v-if="unreadCount" class="tab-count">{{ unreadCount }}</span>
          </VTab>
          <VTab value="users">
            <VIcon start icon="tabler-users" size="16" />
            Foydalanuvchilar
          </VTab>
        </VTabs>

        <!-- Inline stats -->
        <div class="chat-header-stats">
          <span class="stat-chip stat-chip--blue">
            <VIcon icon="tabler-users" size="13" />
            {{ users.length }}
          </span>
          <span class="stat-chip stat-chip--green">
            <VIcon icon="tabler-wifi" size="13" />
            {{ onlineCount }} online
          </span>
          <span v-if="threads.filter(t=>!t.hasOwnerReply).length" class="stat-chip stat-chip--amber">
            <VIcon icon="tabler-message-exclamation" size="13" />
            {{ threads.filter(t=>!t.hasOwnerReply).length }} kutilmoqda
          </span>
        </div>
      </div>

      <VDivider />

      <!-- ═══════════════ INBOX ═══════════════ -->
      <div v-show="tab === 'inbox'" class="chat-body-inner">
          <div class="chat-shell">

            <!-- Thread list: hidden on mobile when chat is open -->
            <div class="chat-thread-col"
                 :class="{ 'is-hidden-mobile': isMobile && activeThread }">
              <div class="chat-thread-header">
                <span class="chat-thread-header__title">Suhbatlar</span>
                <button class="chat-icon-btn" @click="fetchThreads" :disabled="threadsLoading">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                  </svg>
                </button>
              </div>

              <div v-if="threadsLoading && threads.length===0" class="chat-thread-empty">
                <div class="chat-spinner" />
              </div>
              <div v-else-if="threads.length===0" class="chat-thread-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Hali xabar yo'q</span>
              </div>

              <div v-else class="chat-thread-list">
                <div
                  v-for="thread in sortedThreads" :key="thread.id"
                  class="chat-thread-item"
                  :class="{ 'is-active': activeThread?.id === thread.id }"
                  @click="openThread(thread)"
                >
                  <div class="chat-thread-avatar">
                    {{ initials(thread.user?.displayName || thread.visitorName) }}
                  </div>
                  <div class="chat-thread-info">
                    <div class="chat-thread-info__top">
                      <span class="chat-thread-info__name">
                        {{ thread.user?.displayName || thread.visitorName }}
                      </span>
                      <span class="chat-thread-info__time">{{ formatTime(thread.updatedAt) }}</span>
                    </div>
                    <div class="chat-thread-info__preview">
                      {{ thread.lastMessage }}
                    </div>
                  </div>
                  <span v-if="!thread.hasOwnerReply && !readThreadIds.includes(thread.id)" class="chat-unread-dot" />
                </div>
              </div>
            </div>

            <!-- Chat window: full-width on mobile when thread selected -->
            <div class="chat-window"
                 :class="{ 'is-mobile-full': isMobile && activeThread }">
              <!-- Empty state -->
              <div v-if="!activeThread" class="chat-window-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 0 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Suhbatni tanlang</span>
              </div>

              <template v-else>
                <!-- Window header -->
                <div class="chat-window-header">
                  <!-- Back button (mobile only) -->
                  <button v-if="isMobile" class="chat-back-btn" @click="goBackToList">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <polyline points="15,18 9,12 15,6"/>
                    </svg>
                  </button>
                  <div class="chat-window-avatar">
                    {{ initials(activeThread.user?.displayName || activeThread.visitorName) }}
                  </div>
                  <div>
                    <p class="chat-window-name">
                      {{ activeThread.user?.displayName || activeThread.visitorName }}
                    </p>
                    <span class="chat-window-handle">
                      @{{ activeThread.user?.username || '—' }}
                    </span>
                  </div>
                  <span
                    class="chat-presence-pill"
                    :class="{ 'is-live': isOnline(activeThread.user || {}) }"
                  >
                    {{ isOnline(activeThread.user || {}) ? 'active now' : 'offline' }}
                  </span>
                </div>

                <!-- Messages -->
                <div ref="msgsContainer" class="chat-messages">
                  <div v-if="msgsLoading" class="chat-messages-loading">
                    <div class="chat-spinner" />
                  </div>
                  <div v-else-if="!messages.filter(m=>!m.deletedAt).length" class="chat-messages-empty">
                    Hali xabar yo'q
                  </div>
                  <template v-else>
                    <div
                      v-for="msg in messages.filter(m=>!m.deletedAt)" :key="msg.id"
                      class="chat-bubble-wrap"
                      :class="msg.sender === 'owner' ? 'is-owner' : 'is-visitor'"
                    >
                      <div class="chat-bubble">
                        <p v-if="msg.sender !== 'owner'" class="chat-bubble__author">
                          {{ msg.author }}
                        </p>
                        <p class="chat-bubble__text">{{ msg.text }}</p>
                        <div class="chat-bubble__footer">
                          <span class="chat-bubble__time">{{ formatTime(msg.createdAt) }}</span>
                          <span v-if="msg.sender==='owner' && msg.seenByVisitorAt" class="chat-bubble__seen">Seen</span>
                          <span v-else-if="msg.sender==='owner'" class="chat-bubble__sent">Sent</span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Composer -->
                <div class="chat-composer-wrap">
                  <div class="chat-composer">
                    <textarea
                      ref="textareaRef"
                      v-model="replyText"
                      class="chat-composer__input"
                      placeholder="Javob yozing..."
                      rows="1"
                      @keydown="onReplyKey"
                      @input="autoResize"
                    />
                    <button
                      class="chat-composer__send"
                      :disabled="!replyText.trim() || replySending"
                      @click="sendReply"
                    >
                      <svg v-if="!replySending" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <div v-else class="chat-spinner chat-spinner--sm" />
                    </button>
                  </div>
                  <p v-if="sendError" class="chat-composer__error">{{ sendError }}</p>
                  <p v-else class="chat-composer__hint">Enter — yuborish · Shift+Enter — yangi qator</p>
                </div>
              </template>
            </div>
          </div>
        </div>

      <!-- ═══════════════ USERS ═══════════════ -->
      <div v-show="tab === 'users'" class="chat-body-inner users-panel">

          <!-- Search + counters -->
          <div class="d-flex justify-space-between align-center flex-wrap gap-3 mb-3">
            <div class="d-flex align-center gap-2">
              <span class="text-subtitle-2 font-weight-bold">Ro'yxatdan o'tganlar</span>
              <VChip size="x-small" color="primary" variant="tonal">{{ users.length }}</VChip>
              <VChip size="x-small" color="success" variant="tonal">{{ onlineCount }} online</VChip>
            </div>
            <div class="users-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                class="users-search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                v-model="userSearch"
                type="search"
                placeholder="Ism yoki username..."
                class="users-search-input"
              />
            </div>
          </div>

          <!-- Loading -->
          <div v-if="usersLoading" class="d-flex justify-center py-8">
            <VProgressCircular indeterminate color="primary" size="32" />
          </div>

          <!-- Empty -->
          <div v-else-if="filteredUsers.length === 0"
            class="d-flex flex-column align-center py-10 gap-2 text-medium-emphasis">
            <VIcon icon="tabler-user-off" size="44" />
            <span class="text-body-2">
              {{ userSearch ? 'Hech narsa topilmadi' : "Foydalanuvchi yo'q" }}
            </span>
          </div>

          <!-- Table -->
          <div v-else class="users-table-wrap">
            <table class="users-table">
              <thead>
                <tr>
                  <th style="width:48px">#</th>
                  <th>Foydalanuvchi</th>
                  <th>Username</th>
                  <th style="width:110px">Holat</th>
                  <th>Ro'yxatdan o'tgan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(u, i) in filteredUsers" :key="u.id">
                  <td class="users-table__num">{{ i + 1 }}</td>
                  <td>
                    <div class="d-flex align-center gap-3">
                      <VAvatar color="primary" size="34">
                        <span style="font-size:.78rem;font-weight:700">
                          {{ initials(u.displayName || u.username) }}
                        </span>
                      </VAvatar>
                      <span class="font-weight-semibold" style="font-size:.9rem">
                        {{ u.displayName || u.username }}
                      </span>
                    </div>
                  </td>
                  <td><code style="font-size:.82rem">@{{ u.username }}</code></td>
                  <td>
                    <VChip
                      :color="isOnline(u) ? 'success' : 'secondary'"
                      size="small" variant="tonal"
                    >
                      <span class="users-online-dot"
                        :style="{ background: isOnline(u) ? '#22c55e' : '#94a3b8' }" />
                      {{ isOnline(u) ? 'Online' : 'Offline' }}
                    </VChip>
                  </td>
                  <td class="users-table__date">{{ formatDate(u.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

    </VCard>
  </section>
</template>

<style scoped>
/* ══════════════════════════════════════════════════════════
   PAGE: fills content area, no page scroll
══════════════════════════════════════════════════════════ */
.chat-page {
  /* Vuetify sets --v-layout-top for the AppBar offset */
  height: calc(100dvh - var(--v-layout-top, 64px) - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-card {
  flex: 1;
  min-height: 0;
  display: flex !important;
  flex-direction: column;
}

/* Tab bar + inline stats row */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.chat-tabs { flex-shrink: 0; }

.chat-header-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.stat-chip--blue  { background: rgba(99,102,241,.12); color: #6366f1; }
.stat-chip--green { background: rgba(34,197,94,.12);  color: #16a34a; }
.stat-chip--amber { background: rgba(245,158,11,.12); color: #d97706; }

/* Content area below tabs — fills remaining VCard height */
.chat-body-inner {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* ── Chat shell (inbox) ──────────────────────────────────── */
.chat-shell {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ── Thread column ──────────────────────────────────────────────── */
.chat-thread-col {
  width: 300px;
  flex-shrink: 0;
  border-right: 1.5px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-thread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.chat-thread-header__title {
  font-size: .8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.chat-icon-btn {
  background: none;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: #64748b;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.chat-icon-btn:hover { border-color: #16a34a; color: #15803d; }

.chat-thread-list { flex: 1; overflow-y: auto; }

.chat-thread-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  color: #94a3b8;
  font-size: .8rem;
  padding: 2rem;
}

.chat-thread-item {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  transition: background .12s;
  position: relative;
}
.chat-thread-item:hover { background: #f8fafc; }
.chat-thread-item.is-active { background: #f0fdf4; border-left: 3px solid #16a34a; }

.chat-thread-avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #16a34a;
  color: #fff;
  font-size: .82rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.chat-thread-info { flex: 1; min-width: 0; }
.chat-thread-info__top { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
.chat-thread-info__name { font-size: .82rem; font-weight: 700; color: #0f172a; truncate: true; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-thread-info__time { font-size: .68rem; color: #94a3b8; flex-shrink: 0; }
.chat-thread-info__preview { font-size: .75rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: .12rem; }

.chat-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f59e0b;
  flex-shrink: 0;
}

/* ── Chat window ─────────────────────────────────────────────────── */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-width: 0;
}

.chat-window-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  color: #94a3b8;
  font-size: .82rem;
}

/* Window header */
.chat-window-header {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 1.25rem;
  border-bottom: 1.5px solid #e2e8f0;
  flex-shrink: 0;
}

.chat-window-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #16a34a;
  color: #fff;
  font-size: .78rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.chat-window-name { margin: 0; font-size: .88rem; font-weight: 700; color: #0f172a; }
.chat-window-handle { font-size: .7rem; color: #94a3b8; }

.chat-presence-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  border: 1.5px solid #e2e8f0;
  border-radius: 999px;
  padding: .22rem .56rem;
  color: #64748b;
  background: #f8fafc;
  font-size: .68rem;
  font-weight: 700;
  text-transform: lowercase;
  margin-left: auto;
}
.chat-presence-pill.is-live {
  color: #15803d;
  border-color: rgba(22,163,74,.35);
  background: #f0fdf4;
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: .56rem;
  scroll-behavior: smooth;
}

.chat-messages-loading,
.chat-messages-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: .8rem;
  gap: .5rem;
}

.chat-bubble-wrap {
  display: flex;
  max-width: 72%;
}
.chat-bubble-wrap.is-visitor { align-self: flex-start; }
.chat-bubble-wrap.is-owner   { align-self: flex-end; }

.chat-bubble {
  display: grid;
  gap: .28rem;
  padding: .58rem .76rem;
  border-radius: 18px;
}

.is-visitor .chat-bubble {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}

.is-owner .chat-bubble {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
}

.chat-bubble__author { margin: 0; font-size: .73rem; font-weight: 700; color: #15803d; }
.chat-bubble__text   { margin: 0; font-size: .88rem; line-height: 1.56; color: #0f172a; white-space: pre-wrap; word-break: break-word; }
.chat-bubble__footer { display: flex; align-items: center; justify-content: flex-end; gap: .38rem; }
.chat-bubble__time   { font-size: .67rem; color: #94a3b8; }
.chat-bubble__seen,
.chat-bubble__sent   { font-size: .65rem; font-weight: 700; color: #94a3b8; }
.chat-bubble__seen   { color: #16a34a; }

/* Composer */
.chat-composer-wrap {
  flex-shrink: 0;
  padding: .56rem 1rem;
  border-top: 1.5px solid #e2e8f0;
  background: #fff;
}

.chat-composer {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: .5rem;
  padding: .44rem .52rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 24px;
  background: #f8fafc;
  transition: border-color .15s, background .15s;
}
.chat-composer:focus-within {
  border-color: #16a34a;
  background: #fff;
}

.chat-composer__input {
  resize: none;
  border: 0;
  padding: .5rem 0;
  background: transparent;
  font-family: inherit;
  font-size: .9rem;
  line-height: 1.5;
  color: #0f172a;
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
}
.chat-composer__input:focus { outline: none; }
.chat-composer__input::placeholder { color: #94a3b8; }

.chat-composer__send {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  background: #16a34a;
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background .15s;
}
.chat-composer__send:hover:not(:disabled) { background: #15803d; }
.chat-composer__send:disabled { opacity: .45; cursor: not-allowed; }

.chat-composer__hint {
  margin: .3rem 0 0;
  font-size: .67rem;
  color: #94a3b8;
  text-align: right;
}

.chat-composer__error {
  margin: .3rem 0 0;
  font-size: .67rem;
  color: #ef4444;
  text-align: right;
}

/* Users panel scrolls internally */
.users-panel {
  overflow-y: auto;
  padding: 16px;
}

/* Users search */
.users-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.users-search-icon {
  position: absolute;
  left: 10px;
  color: #94a3b8;
  pointer-events: none;
  flex-shrink: 0;
}
.users-search-input {
  padding: .5rem .75rem .5rem 2rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-family: inherit;
  font-size: .84rem;
  color: #0f172a;
  background: #f8fafc;
  width: 220px;
  outline: none;
  transition: border-color .15s, background .15s;
}
.users-search-input:focus { border-color: #16a34a; background: #fff; }
.users-search-input::placeholder { color: #94a3b8; }

/* Users table */
.users-table-wrap {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .875rem;
}
.users-table thead tr {
  background: #f8fafc;
  border-bottom: 1.5px solid #e2e8f0;
}
.users-table th {
  padding: .65rem 1rem;
  text-align: left;
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #64748b;
}
.users-table td {
  padding: .75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.users-table tbody tr:last-child td { border-bottom: none; }
.users-table tbody tr:hover { background: #f8fafc; }
.users-table__num { color: #94a3b8; font-size: .82rem; }
.users-table__date { color: #64748b; font-size: .78rem; white-space: nowrap; }
.users-online-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  margin-right: 5px;
  flex-shrink: 0;
}

/* Tab unread count */
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f59e0b;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 0 5px;
  margin-left: 6px;
  line-height: 1;
}

/* Back button (mobile) */
.chat-back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  padding: .25rem;
  margin-right: .25rem;
  border-radius: 8px;
  transition: color .15s, background .15s;
  flex-shrink: 0;
}
.chat-back-btn:hover { color: #16a34a; background: #f0fdf4; }

/* Mobile: hide/show panels */
@media (max-width: 639px) {
  .chat-header-stats { display: none; }

  .chat-thread-col {
    width: 100% !important;
    border-right: none;
    flex-shrink: 0;
  }

  /* When a thread is selected — hide list, show window full-width */
  .chat-thread-col.is-hidden-mobile { display: none; }

  .chat-window { display: none; }
  .chat-window.is-mobile-full {
    display: flex;
    width: 100%;
  }

  .chat-window-header { padding: .6rem .9rem; }
  .chat-messages { padding: .75rem 1rem; }
  .chat-composer-wrap { padding: .5rem .75rem; }
}

/* Tablet: slightly narrower thread col */
@media (min-width: 640px) and (max-width: 900px) {
  .chat-thread-col { width: 220px; }
  .chat-header-stats { display: none; }
}

/* Spinner */
.chat-spinner {
  width: 28px; height: 28px;
  border: 2.5px solid #e2e8f0;
  border-top-color: #16a34a;
  border-radius: 999px;
  animation: spin .7s linear infinite;
}
.chat-spinner--sm { width: 18px; height: 18px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
