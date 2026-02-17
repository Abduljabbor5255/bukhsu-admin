import { hasOwnProperty } from "@/util/object.util"

export function computedStatusClass(status) {
  if (status) {
    return `status-${status['en'].replaceAll(' ', '')}`
  } else {
    return 'status-default'
  }
}

export function sortItems(item, key1, key2) {
  return item.sort((a, b) => {
    if (!key1) {
      return a < b ? -1 : a > b ? 1 : 0
    } else if (!key2) {
      return a[key1] < b[key1] ? -1 : a[key1] > b[key1] ? 1 : 0
    } else {
      if (a[key1] === b[key1]) {
        return a[key2] < b[key2] ? -1 : a[key2] > b[key2] ? 1 : 0
      } else {
        return a[key1] < b[key1] ? -1 : 1
      }
    }
  })
}

export function deletePropertiesWhichNoValue(obj) {
  Object.keys(obj).forEach(key => {
    if (!obj[key]) {
      delete obj[key]
    }
  })
}

export function clearObjectValues(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === null) return

    if (key === 'image') return (obj[key] = '')

    if (key === 'merchant') return (obj[key] = null)

    if (typeof obj[key] === 'boolean') return (obj[key] = false)

    if (Array.isArray(obj[key])) return (obj[key] = [])

    if (obj[key]?.toString() === '[object Object]') {
      return clearObjectValues(obj[key])
    } else {
      obj[key] = ''
    }
  })

  return obj
}

export function copyObjectWithoutID(obj) {
  const deepClonedObj = JSON.parse(JSON.stringify(obj))
  let newObj = {}
  Object.keys(deepClonedObj).filter(key => {
    if (key !== 'id' && key !== 'uuid') {
      newObj[key] = deepClonedObj[key]
    }
  })

  return newObj
}

export function updateObjectToNew(currentObj, updatedObj) {
  Object.keys(currentObj).forEach(key => {
    currentObj[key] = updatedObj[key]
  })
}

export function getNameByLang(names) {
  let chosenName
  Object.keys(names).forEach(key => {
    if (key === localStorage.getItem('lang')) return (chosenName = names[key])
  })

  return chosenName
}

export function appendToFormData(object) {
  let formData = new FormData()

  Object.keys(object).forEach(key => {
    if (object[key] === null) formData.append(key, 0)

    // else if (key === 'image' && typeof object[key] === 'string'){}
    else if (typeof object[key] === 'boolean') {
      if (object[key]) {
        formData.append(key, 1)
      } else {
        formData.append(key, 0)
      }
    } else if (object[key]?.toString() === '[object Object]') {
      Object.keys(object[key]).forEach(name => {
        formData.append(`${key}[${name}]`, object[key][name])
      })
    } else {
      formData.append(key, object[key])
    }
  })

  return formData
}

export function sliceOnlyFirstLetter(str) {
  return str.charAt(0)
}

export function generateIconToBoolean(item) {
  return item ? 'CheckIcon' : 'XIcon'
}

export function generateIconColorToBoolean(item) {
  return item ? 'text-success' : 'text-danger'
}

export function prefixZeroToNum(num) {
  if (+num < 10) return `0${num}`

  return num
}

export function abbreviateNumber(n) {
  if (n < 1e3) return n
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(3) + 'K'
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(3) + 'M'
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(3) + 'B'
  if (n >= 1e12) return +(n / 1e12).toFixed(3) + 'T'
}

export function numberFormat(num) {
  var p = num.toFixed(2).split('.')

  return (
    '' +
    p[0]
      .split('')
      .reverse()
      .reduce(function (acc, num, i, orig) {
        return num + (num !== '-' && i && !(i % 3) ? ',' : '') + acc
      }, '')
  )
}

export function getValueMatchLocale(data) {
  const locale = localStorage.getItem('ACCEPT_LANGUAGE') || 'ru'
  if (data && Object.keys(data) && hasOwnProperty(data, locale)) {
    return data[locale]
  } else {
    return data || ''
  }
}

export function sortObjectValues(obj) {
  const loopPackage = {}

  for (let [key, value] of Object.entries(obj)) {
    if (value) {
      loopPackage[key] = value
    }
  }

  return loopPackage
}

const IMAGE_BASE_URL = 'http://62.113.58.93:3005'

export function getFullImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return IMAGE_BASE_URL + path
}
