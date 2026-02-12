import { ref } from "vue"

export async function useFetch({ apiMethod, body = {}, config = {} }) {
  const pending = ref(false)
  const error = ref(null)
  const data = ref(null)

  await execute()

  async function execute(){
    pending.value = true
    try {
      const response = await apiMethod(body, config)

      data.value = response.data
    } catch (e) {
      console.error('useFetch', e)
      if (e?.response?.data?.message) {
        error.value = e.response.data.message
      } else if (e?.message) {
        error.value = e.message
      }
    } finally {
      pending.value = false
    }
  }

  function refresh(){
    execute()
  }

  return {
    data,
    error,
    pending,
    refresh,
  }
}
