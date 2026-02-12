export class localStorageController {
  static get(key) {
    return localStorage.getItem(key)
  }

  static set(key, value) {
    return localStorage.setItem(key, value)
  }

  static remove(key) {
    return localStorage.removeItem(key)
  }
}

export class sessionStorageController {
  static get(key) {
    return sessionStorage.getItem(key)
  }

  static set(key, value) {
    return sessionStorage.setItem(key, value)
  }

  static remove(key) {
    return sessionStorage.removeItem(key)
  }
}

export const setLocalStorageVariable = (key, value) => {
  return localStorage.setItem(key, value)
}

export const getLocalStorageVariable = key => {
  return localStorage.getItem(key)
}

export const removeLocalStorageVariable = key => {
  return localStorage.removeItem(key)
}

export const setSessionStorageVariable = (key, value) => {
  return sessionStorage.setItem(key, value)
}

export const getSessionStorageVariable = key => {
  return sessionStorage.getItem(key)
}
