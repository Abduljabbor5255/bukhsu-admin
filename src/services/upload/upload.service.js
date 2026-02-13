import CoreAxios from '@/services/axios/core.axios'

class UploadService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 1,
      endpoint: '/admin',
    })
  }

  uploadFile(body) {
    // Legacy support or specific chat upload if needed, but likely needs refactor to generic upload
    return this.post('/upload', body)
  }

  uploads({ uploadServiceName, body, config = {} }) {
    // Map service name to folder param
    return this.post(`/upload?folder=${uploadServiceName}`, body, config)
  }

  imageUploader() {
    return this.post(`/upload`)
  }
}

export const uploadApi = new UploadService()


