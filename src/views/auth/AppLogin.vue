<script setup>
import { ref } from "vue"
import * as yup from "yup"
import { useForm } from "vee-validate"
import { authApi } from "@/services/auth/auth.service"

import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import LoginInput from "@/views/auth/components/LoginInput.vue"
import { useLoading } from "@/composable/useLoading"
import { useRouter } from "vue-router"

const router = useRouter()

const { values, errors, defineInputBinds } = useForm({
  validationSchema: yup.object({
    login: yup.string().required(),
    password: yup.string().required(),
  }),
})

const login = defineInputBinds('login')
const password = defineInputBinds('password')
const { isFetching, startFetching, finishFetching } = useLoading()

async function authorize() {
  try {
    startFetching()

    const rsp = await authApi.authorize(values)

    const userName = rsp.data.data.user.login
    const { accessToken } = rsp.data.data

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userName', userName)

    await router.push({
      name: 'home',
    })
  } catch (e){
    console.error(e)
  } finally {
    finishFetching()
  }
}

const isPasswordVisible = ref(false)
const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background rounded-lg w-100 ma-8 me-0">
        <div class="d-flex align-center justify-center w-100 h-100">
          <VImg
            max-width="505"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <VImg
          class="auth-footer-mask"
          :src="authThemeMask"
        />
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4 w-100"
      >
        <VCardText>
          <VForm @submit.prevent="authorize">
            <VRow>
              <!-- login -->
              <VCol
                cols="12"
                class="py-0"
              >
                <LoginInput
                  name="login"
                  type="login"
                  label="E-mail"
                  placeholder="Your login address"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <LoginInput
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Your password"
                  class="mb-8"
                />
                <VBtn
                  block
                  :loading="isFetching"
                  type="submit"
                >
                  Login
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
@use "@core/scss/template/pages/page-auth.scss";

.validation-failed {
  color: red;
}
</style>

