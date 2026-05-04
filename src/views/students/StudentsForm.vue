<script setup>
import FormUpload from '@/components/form/FormUpload.vue'
import { studentsApi } from '@/services/students/students.service'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading = ref(false)
const isSnackbarVisible = ref(false)
const snackbarText = ref('')

const form = reactive({
  title: '',
  image: null,
  direction: '',
  achievement: '',
})

const errors = reactive({ title: '' })

function validate() {
  errors.title = form.title.trim() ? '' : 'Majburiy maydon'
  return !errors.title
}

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await studentsApi.findOne({ params: { id } })
    const r = data.result
    Object.assign(form, {
      title: r.title || '',
      image: r.image || null,
      direction: r.direction || '',
      achievement: r.achievement || '',
    })
  } catch (e) {
    console.error(e)
  } finally {
    pageLoading.value = false
  }
}

async function submit() {
  if (!validate()) return
  btnLoading.value = true
  try {
    const payload = { type: 'student', draft: false, ...form }
    if (isEdit.value) {
      await studentsApi.update({ params: { id: route.params.id, ...payload } })
      snackbarText.value = "O'quvchi yangilandi"
    } else {
      await studentsApi.create({ params: payload })
      snackbarText.value = "O'quvchi yaratildi"
    }
    isSnackbarVisible.value = true
    setTimeout(() => router.push({ name: 'students' }), 800)
  } catch (e) {
    console.error(e)
  } finally {
    btnLoading.value = false
  }
}

onMounted(() => {
  if (isEdit.value) fetchItem(route.params.id)
})
</script>

<template>
  <section>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center gap-3">
        <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'students' }" />
        <h2 class="text-h4">{{ isEdit ? "O'quvchini tahrirlash" : "O'quvchi yaratish" }}</h2>
      </div>
      <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
        Saqlash
      </VBtn>
    </div>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" />

    <VRow>
      <!-- Main info -->
      <VCol cols="12" md="8">
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Asosiy ma'lumotlar</p>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.title"
                  label="To'liq ismi *"
                  :error-messages="errors.title"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12">
                <VTextField v-model="form.direction" label="Yo'nalish / Mutaxassislik" />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="form.achievement"
                  label="Yutuq / Muvaffaqiyat"
                  rows="4"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Photo -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Rasm</p>
            <FormUpload
              v-model="form.image"
              name="image"
              label="Rasm yuklash"
              upload-service-name="students"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar v-model="isSnackbarVisible" color="success">{{ snackbarText }}</VSnackbar>
  </section>
</template>
