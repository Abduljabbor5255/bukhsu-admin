<script setup>
import NavBarI18n from '@core/components/I18n.vue'

const i18nCompLanguages = [
  {
    label: 'RU',
    i18nLang: 'ru',
  },
  {
    label: 'UZ',
    i18nLang: 'uz',
  },
  {
    label: 'EN',
    i18nLang: 'en',
  },
]

const handleLangChange = lang => {
  localStorage.setItem('lang', lang)
}
</script>

<template>
<!--  <NavBarI18n -->
<!--    :languages="i18nCompLanguages" -->
<!--    @change="handleLangChange" -->
<!--  /> -->
</template>
