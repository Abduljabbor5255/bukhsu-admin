import CoreAxios from '@/services/axios/core.axios'

class ManagementService extends CoreAxios {
    constructor() {
        super({
            apiVersion: 1,
            endpoint: '/admin/management',
        })
    }
}

export const managementApi = new ManagementService()
