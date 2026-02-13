import CoreAxios from '@/services/axios/core.axios'

class ToursService extends CoreAxios {
    constructor() {
        super({
            apiVersion: 1,
            endpoint: '/admin/concerts',
        })
    }
}

export const toursApi = new ToursService()
