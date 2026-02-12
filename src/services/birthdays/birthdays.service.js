import CoreAxios from '@/services/axios/core.axios'

class BirthdaysService extends CoreAxios {
    constructor() {
        super({
            apiVersion: 1,
            endpoint: '/birthdays',
        })
    }
}

export const birthdaysApi = new BirthdaysService()
