import { getInstance } from "@/services/axios/instance.axios"
import { useSnackbarStore } from "@/store/snackbar.store"

export default class CoreAxios {
  constructor({ axiosIns = null, apiVersion = 1, endpoint = '' }
    = { axiosIns: null, instanceName: null, endpoint: '' },
  ) {
    if (axiosIns) {
      this._axios = axiosIns
    } else {
      this._axios = getInstance({
        apiVersion,
        endpoint,
      })
    }
  }

  get(url, config) {
    return this._axios.get(url, config).catch(throwRequestError)
  }

  post(url, body = {}, config) {
    return this._axios.post(url, body, config).catch(throwRequestError)
  }

  put(url, body = {}, config) {
    return this._axios.put(url, body, config).catch(throwRequestError)
  }

  delete(url) {
    return this._axios.delete(url).catch(throwRequestError)
  }

  findAll(params = {}) {
    return this.post('/list', params.params || params)
  }

  findOne(params = {}) {
    return this.post('/getOne', params.params || params)
  }

  create(params = {}) {
    return this.post('/create', params.params || params)
  }

  update(params = {}) {
    return this.post('/update', params.params || params)
  }

  remove(params = {}) {
    return this.post('/delete', params.params || params)
  }
}

export function throwRequestError(error) {
  console.error('RequestError: ', error)

  const snackbarStore = useSnackbarStore()

  if (error.hasOwnProperty('response')) {
    const hasMessageInData = error.response.hasOwnProperty('data') &&
      error.response.data.hasOwnProperty('messages')

    if (hasMessageInData) {
      snackbarStore.showSnackbar(`${error.response.data.message} | status:${error.response.status}`)
    } else {
      snackbarStore.showSnackbar(error.message)
    }
  } else if (error.hasOwnProperty('message')) {
    snackbarStore.showSnackbar(error.message)
  } else {
    snackbarStore.showSnackbar(error)
  }

  return new Promise(function throwError(resolve, reject) {
    return reject(error)
  })
}

