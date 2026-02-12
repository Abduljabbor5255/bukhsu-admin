import CoreAxios from '@/services/axios/core.axios'

class NewsService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 1,
      endpoint: '/news',
    })
  }

  // Add specific methods here if needed, e.g. for uploads or related data
}

export const newsApi = new NewsService()
