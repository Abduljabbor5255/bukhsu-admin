import CoreAxios from '@/services/axios/core.axios'

class PartnersService extends CoreAxios {
    constructor() {
        super({
            apiVersion: 1,
            endpoint: '/admin/partners',
        })
    }
}

export const partnersApi = new PartnersService()
