import { ref, unref } from "vue"
import { defineStore } from "pinia"

export const useSnackbarStore = defineStore('snackbar', function () {
  const snackbarOptions = ref({
    variant: 'flat',
    multiLine: true,
    isSnackbarVisible: false,
    location: 'top right',
    message: '',
    color: 'error',
    timeout: 2000,
  })

  const generalMessages = ref({
    created: 'Item successfully created!',
    updated: 'Item successfully updated!',
    deleted: 'Item successfully deleted!',
  })

  function setVariant(variant) {
    snackbarOptions.value.variant = variant
  }

  function setTimeout(timeout) {
    snackbarOptions.value.timeout = timeout
  }

  function setMultiLine(multiLine) {
    snackbarOptions.value.multiLine = multiLine
  }

  function showSnackbar(message) {
    setMessage(message)
    setLocation('top right')
    setColor('error')
    snackbarOptions.value.isSnackbarVisible = true
  }

  function setLocation(location) {
    snackbarOptions.value.location = location
  }

  function setMessage(message) {
    snackbarOptions.value.message = message
  }

  function setColor(color) {
    snackbarOptions.value.color = color
  }

  function show({ message = '', type = 'created', location = 'top center', color='success' } =
  { message: '', type: 'created', location: 'top center', color: 'success' },
  ) {
    setColor(color)
    setLocation(location)

    if (message.trim().length) {
      setMessage(message)
      snackbarOptions.value.isSnackbarVisible = true
    } else if (['created', 'updated', 'deleted'].includes(type)) {
      setColor(
        type === 'deleted' ? 'error' : 'success',
      )
      setMessage(generalMessages.value[type])
      snackbarOptions.value.isSnackbarVisible = true
    }
  }

  return {
    snackbarOptions,
    setVariant,
    setMultiLine,
    showSnackbar,
    show,
    setLocation,
    setMessage,
    setColor,
    setTimeout,
  }
})
