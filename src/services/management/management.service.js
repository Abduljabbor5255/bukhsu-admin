import CoreAxios from '@/services/axios/core.axios'

class ManagementService extends CoreAxios {
    constructor() {
        super({
            apiVersion: 1,
            endpoint: '/management',
        })
    }
}

export const managementApi = new ManagementService()
