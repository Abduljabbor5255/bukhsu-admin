import CoreAxios from '@/services/axios/core.axios'

class AuthService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 1,
      endpoint: '/auth',
    })
  }

  authorize(body) {
    return this.post('/login', body)
  }
}

export const authApi = new AuthService()

