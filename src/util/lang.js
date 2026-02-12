import { getLocalVar } from '@/util/localstorage-helper'

const localLang = getLocalVar('lang')

export function checkLocales(value) {
  if (typeof value === 'object') {
    if (localLang === 'uz') {
      return value.uz
    } else if (localLang === 'ru') {
      return value.ru
    } else {
      return value.en
    }
  }

  return value
}
