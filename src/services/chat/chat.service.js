import axios from 'axios'

const buxduNextUrl = import.meta.env.VITE_BUXDU_NEXT_URL || 'http://localhost:3000'
const adminToken   = import.meta.env.VITE_ADMIN_TOKEN     || 'thinkopolis-admin'

const chatInstance = axios.create({
  baseURL: buxduNextUrl,
  headers: { 'x-admin-token': adminToken },
})

export const chatApi = {
  // Registered users list
  getUsers() {
    return chatInstance.get('/api/admin/users')
  },

  // All chat threads (conversations) with user info
  getThreads() {
    return chatInstance.get('/api/admin/threads')
  },

  // Messages in a specific thread
  getMessages(threadId) {
    return chatInstance.get(`/api/admin/threads/${threadId}`)
  },

  // Admin reply in a thread
  reply(threadId, text) {
    return chatInstance.post(`/api/admin/threads/${threadId}`, { text })
  },

  // Delete user + all their messages
  deleteUser(userId) {
    return chatInstance.delete(`/api/admin/users/${userId}`)
  },
}
