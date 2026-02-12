import { ref } from "vue"

export function useLoading(){
  const loading = ref(false)

  function start(){
    loading.value = true
  }

  function finish(){
    loading.value = false
  }

  return {
    loading,
    start,
    finish,
    isFetching: loading,
    startFetching: start,
    finishFetching: finish,
  }
}
