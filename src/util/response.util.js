import Vue from 'vue'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'

export function checkSuccessStatus(response) {
  return response.status === 200 || response.status === 201
}

export function showRequestErrorByToast(e) {
  let text = e?.response?.data?.message ?? e.message
  let title = 'Error '
  if (e?.response?.status) {
    title += `(status : ${e.response.status})`
  }

  Vue.$toast(
    {
      component: ToastificationContent,
      props: {
        title,
        text,
        icon: 'InfoIcon',
        variant: 'danger',
      },
    },
    {
      position: 'top-right',
    },
  )
}
