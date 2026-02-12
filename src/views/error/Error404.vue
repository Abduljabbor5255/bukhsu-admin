<script setup>
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import pages404 from '@images/pages/404.png'
import error404 from '@images/pages/error-404.svg'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)
</script>

<template>
  <div class="misc-wrapper">
    <p class="text-404">
      404
    </p>
    <ErrorHeader :error-title="$t('page_not_found')" />
    <VBtn
      :to="{ name: 'home' }"
      class="mb-12"
    >
      {{ $t('button.back_to_main') }}
    </VBtn>

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="error404"
        alt="Coming Soon"
        :max-width="400"
        class="mx-auto"
      />
    </div>

    <VImg
      :src="authThemeMask"
      class="misc-footer-img d-none d-md-block"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "@core/scss/template/pages/misc.scss";

.text-404 {
  font-size: 100px;
  font-weight: 700;
  line-height: 100px;
}
</style>

<!-- <route lang="yaml"> -->
<!-- meta: -->
<!-- layout: blank -->
<!-- </route> -->
