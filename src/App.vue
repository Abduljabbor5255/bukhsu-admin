<script setup>
import { computed } from "vue"
import { useTheme } from 'vuetify'
import { useRoute } from "vue-router"
import { useSnackbarStore } from "@/store/snackbar.store"
import ScrollToTop from '@core/components/ScrollToTop.vue'
import { useThemeConfig } from '@core/composable/useThemeConfig'
import { hexToRgb } from '@layouts/utils'
import DefaultLayout from "@/layouts/DefaultLayout.vue"
import BlankLayout from "@/layouts/BlankLayout.vue"

// import { CURRENT_MERCHANT } from "@/constants/generate.constants"

const {
  syncInitialLoaderTheme,
  syncVuetifyThemeWithTheme: syncConfigThemeWithVuetifyTheme,
  isAppRtl,
  handleSkinChanges,
} = useThemeConfig()

const { snackbarOptions } = useSnackbarStore()

const { global } = useTheme()
const route = useRoute()

const layout = computed(function matchLayout(){
  if(route.meta.layout === 'blank'){
    return BlankLayout
  }

  return DefaultLayout
})

syncInitialLoaderTheme()
syncConfigThemeWithVuetifyTheme()
handleSkinChanges()
</script>

<template>
  <VLocaleProvider :rtl="isAppRtl">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp
      id="vAppWrapper"
      :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`"
    >
      <Component :is="layout" />
      <ScrollToTop />
      <VSnackbar
        v-model="snackbarOptions.isSnackbarVisible"
        :location="snackbarOptions.location"
        :color="snackbarOptions.color"
        :variant="snackbarOptions.variant"
        :multi-line="snackbarOptions.multiLine"
        :timeout="snackbarOptions.timeout"
      >
        {{ snackbarOptions.message }}
      </VSnackbar>
    </VApp>
  </VLocaleProvider>
</template>
