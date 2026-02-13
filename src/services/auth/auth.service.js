import CoreAxios from '@/services/axios/core.axios'

class AuthService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 1,
      endpoint: '/admin/auth',
    })
  }

  authorize(body) {
    return this.post('/login', body)
  }
}

export const authApi = new AuthService()

