<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import { eventsApi } from '@/services/events/events.service'
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
  date: '',
  image: null,
  description: '',
  location: '',
  fee: '',
  apply_url: '',
  speaker: [],
})

function addSpeaker() {
  form.speaker.push({ name: '', image: null, designation: '' })
}

function removeSpeaker(i) {
  form.speaker.splice(i, 1)
}

const errors = reactive({ title: '' })

function validate() {
  errors.title = form.title.trim() ? '' : 'Majburiy maydon'
  return !errors.title
}

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await eventsApi.findOne({ params: { id } })
    const r = data.result
    Object.assign(form, {
      title: r.title || '',
      date: r.date ? r.date.slice(0, 10) : '',
      image: r.image || null,
      description: r.description || '',
      location: r.location || '',
      fee: r.fee || '',
      apply_url: r.apply_url || '',
      speaker: Array.isArray(r.speaker)
        ? r.speaker.map(s => ({ name: s.name || '', image: s.image || null, designation: s.designation || '' }))
        : [],
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
    const payload = { type: 'event', draft: false, ...form }
    if (isEdit.value) {
      await eventsApi.update({ params: { id: route.params.id, ...payload } })
      snackbarText.value = 'Tadbir yangilandi'
    } else {
      await eventsApi.create({ params: payload })
      snackbarText.value = 'Tadbir yaratildi'
    }
    isSnackbarVisible.value = true
    setTimeout(() => router.push({ name: 'events' }), 800)
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
        <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'events' }" />
        <h2 class="text-h4">{{ isEdit ? 'Tadbirni tahrirlash' : 'Tadbir yaratish' }}</h2>
      </div>
      <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
        Saqlash
      </VBtn>
    </div>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" />

    <VRow>
      <!-- Left column -->
      <VCol cols="12" md="8">

        <!-- Basic info -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Asosiy ma'lumotlar</p>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.title"
                  label="Sarlavha *"
                  :error-messages="errors.title"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.publishDate" label="E'lon sanasi" type="date" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.date" label="Tadbir sanasi" type="date" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Description -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Tavsif</p>
            <AppHtmlEditor v-model="form.description" label="Tavsif" placeholder="Tadbir haqida yozing..." />
          </VCardText>
        </VCard>

        <!-- Details -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Tafsilotlar</p>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField v-model="form.location" label="Joylashuv" prepend-inner-icon="tabler-map-pin" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.fee" label="Qatnashish narxi" prepend-inner-icon="tabler-currency-dollar" />
              </VCol>
              <VCol cols="12">
                <VTextField v-model="form.apply_url" label="Ariza havola (URL)" prepend-inner-icon="tabler-link" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Speakers -->
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Ma'ruzachilar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addSpeaker">
                Qo'shish
              </VBtn>
            </div>

            <div v-if="form.speaker.length === 0" class="text-body-2 text-medium-emphasis text-center py-4">
              Ma'ruzachi qo'shilmagan
            </div>

            <div
              v-for="(spk, i) in form.speaker"
              :key="i"
              class="mb-4 pa-3 rounded"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
            >
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="text-body-2 font-weight-medium">Ma'ruzachi {{ i + 1 }}</span>
                <VBtn icon="tabler-trash" size="x-small" variant="text" color="error" @click="removeSpeaker(i)" />
              </div>
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField v-model="spk.name" label="Ismi" density="compact" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="spk.designation" label="Lavozim / Unvon" density="compact" />
                </VCol>
                <VCol cols="12">
                  <p class="text-body-2 font-weight-medium mb-2">Rasmi</p>
                  <FormUpload
                    v-model="spk.image"
                    :name="`speaker_image_${i}`"
                    label="Rasm yuklash"
                    upload-service-name="events"
                  />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

      </VCol>

      <!-- Right column -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Asosiy rasm</p>
            <FormUpload
              v-model="form.image"
              name="image"
              label="Rasm yuklash"
              upload-service-name="events"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar v-model="isSnackbarVisible" color="success">{{ snackbarText }}</VSnackbar>
  </section>
</template>
