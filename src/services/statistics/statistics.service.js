import CoreAxios from '@/services/axios/core.axios'

class StatisticsService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 1,
      endpoint: '/statistic',
    })
  }

  fetchAppointStatistics(body) {
    return this.post('/appoints', body)
  }

  fetchRegistrationStatistics(body) {
    return this.post('/registration', body)
  }
}

export const statisticsApi = new StatisticsService()

