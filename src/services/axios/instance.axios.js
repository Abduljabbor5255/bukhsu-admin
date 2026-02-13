import router from "@/router"
import axios from "axios"

export {
  axiosBase,
  getInstance
}


function axiosBase({ endpoint = '' }) {
  return generateInstance({ baseUrl: import.meta.env.VITE_APP_URL_V1 + endpoint })
}

// function axiosV2({ endpoint = '' }){
//   return generateInstance({ baseUrl: import.meta.env.VITE_APP_URL_V2 + endpoint })
// }
//
// function axiosV3({ endpoint = '' }){
//   return generateInstance({ baseUrl: import.meta.env.VITE_APP_URL_V3 + endpoint })
// }

function getInstance({ apiVersion = 2, endpoint = '' }) {
  if (apiVersion === 1) {
    return axiosBase({ endpoint })
  }

  // else if(apiVersion === 3){
  //   return axiosV3({ endpoint })
  // }

  // return axiosV2({ endpoint })
}

export function generateInstance({ baseUrl = '' }) {
  const gInstance = axios.create({
    baseURL: baseUrl,
  })

  gInstance.interceptors.request.use(interceptResponseHandler, e => Promise.reject(e))


  gInstance.interceptors.response.use(function returnResponse(rsp) {
    if (rsp.data && rsp.data.meta && !rsp.data.pagination) {
      rsp.data.pagination = rsp.data.meta
    }
    return rsp
  }, interceptErrorHandler)

  return gInstance
}


function interceptResponseHandler(config) {
  const requestConfig = Object.assign({}, config)

  if (!(config.headers['Authorization'] && config.url.includes('login'))) {
    requestConfig.headers['Authorization'] = `Bearer ${localStorage.getItem(
      'accessToken',
    )}`
  }

  requestConfig.headers['Accept-Language'] = localStorage.getItem('locale') || 'ru'
  requestConfig.headers['timeZone'] = Intl.DateTimeFormat().resolvedOptions().timeZone

  return requestConfig
}

async function interceptErrorHandler(error) {
  if (error.response) {
    const { status } = error.response
    if (status === 401 && router.currentRoute.value.name !== 'login') {
      return await router.push({
        name: 'login',
      })
    }
  }

  return Promise.reject(error)
}
