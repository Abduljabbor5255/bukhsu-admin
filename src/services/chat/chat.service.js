import axios from 'axios'

const buxduNextUrl = import.meta.env.VITE_BUXDU_NEXT_URL || 'http://localhost:3000'
const adminToken   = import.meta.env.VITE_ADMIN_TOKEN     || 'thinkopolis-admin'

const chatInstance = axios.create({
  baseURL: buxduNextUrl,
  headers: { 'x-admin-token': adminToken },
})

export const chatApi = {
  getUsers() {
    return chatInstance.get('/api/admin/users')
  },
}
