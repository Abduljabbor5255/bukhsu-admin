import CoreAxios from '@/services/axios/core.axios'

class ContestsService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 1,
      endpoint: '/admin/contests',
    })
  }
}

export const contestsApi = new ContestsService()
