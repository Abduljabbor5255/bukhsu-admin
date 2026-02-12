import i18n from "@/plugins/i18n"
import { useI18n } from "vue-i18n"
import { isObject } from "@/util/inspect"
import { hasOwnProperty } from "@/util/object.util"

export function useLocale(){
  const { locale } = useI18n()

  function getLocaleText(x){
    if(isObject(x) && hasOwnProperty(x, locale.value)){
      return x[locale.value]
    }

    return x
  }

  return {
    getLocaleText,
  }
}
