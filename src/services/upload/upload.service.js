import CoreAxios from '@/services/axios/core.axios'

class UploadService extends CoreAxios {
  constructor() {
    super({
      apiVersion: 2,
    })
  }

  uploadFile(body) {
    return this.post('uploads/chats', body)
  }

  uploads({  uploadServiceName, body, config = {} }){
    return this.post(`uploads/${uploadServiceName}`, body, config)
  }

  imageUploader(){
    return this.post(`uploader/image`)
  }
}

export const uploadApi = new UploadService()


