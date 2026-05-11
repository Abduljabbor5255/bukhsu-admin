<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import LangTabs from '@/components/LangTabs.vue'
import { eventsApi } from '@/services/events/events.service'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isEdit      = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading  = ref(false)
const lang        = ref('uz')
const snackbar    = reactive({ show: false, text: '', color: 'success' })

const form = reactive({
  title: '', title_ru: '', title_en: '',
  description: '', description_ru: '', description_en: '',
  date: '', publishDate: '', image: null,
  location: '', apply_url: '', speaker: [],
})

const F = computed(() => ({
  title:       lang.value === 'uz' ? 'title'       : `title_${lang.value}`,
  description: lang.value === 'uz' ? 'description' : `description_${lang.value}`,
}))

function addSpeaker()     { form.speaker.push({ name: '', image: null, designation: '' }) }
function removeSpeaker(i) { form.speaker.splice(i, 1) }

const errors = reactive({ title: '' })
function validate() {
  errors.title = form.title.trim() ? '' : 'UZ sarlavha majburiy'
  return !errors.title
}

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await eventsApi.findOne({ params: { id } })
    const r = data.result ?? data
    Object.assign(form, {
      title: r.title || '', title_ru: r.title_ru || '', title_en: r.title_en || '',
      description: r.description || '', description_ru: r.description_ru || '', description_en: r.description_en || '',
      date: r.date ? r.date.slice(0, 10) : '',
      publishDate: r.publishDate ? r.publishDate.slice(0, 10) : '',
      image: r.image || null, location: r.location || '', apply_url: r.apply_url || '',
      speaker: Array.isArray(r.speaker)
        ? r.speaker.map(s => ({ name: s.name || '', image: s.image || null, designation: s.designation || '' }))
        : [],
    })
  } catch (e) { console.error(e) }
  finally { pageLoading.value = false }
}

async function submit() {
  if (!validate()) return
  btnLoading.value = true
  try {
    const payload = { type: 'event', draft: false, ...form }
    if (isEdit.value) {
      await eventsApi.update({ params: { id: route.params.id, ...payload } })
      snackbar.text = 'Tadbir yangilandi'
    } else {
      await eventsApi.create({ params: payload })
      snackbar.text = 'Tadbir yaratildi'
    }
    snackbar.color = 'success'; snackbar.show = true
    setTimeout(() => router.push({ name: 'events' }), 800)
  } catch (e) {
    console.error(e)
    snackbar.text = 'Xatolik yuz berdi'; snackbar.color = 'error'; snackbar.show = true
  } finally { btnLoading.value = false }
}

onMounted(() => { if (isEdit.value) fetchItem(route.params.id) })
</script>

<template>
  <section>
    <!-- Header -->
    <VCard class="mb-6" elevation="0" border>
      <VCardText class="py-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <VBtn icon="tabler-arrow-left" variant="text" size="small" :to="{ name: 'events' }" />
            <div>
              <div class="d-flex align-center gap-2 mb-1">
                <h2 class="text-h6 font-weight-bold mb-0">
                  {{ isEdit ? 'Tadbirni tahrirlash' : 'Yangi tadbir' }}
                </h2>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ isEdit ? `Tadbir ID: ${route.params.id}` : form.date ? `Tadbir sanasi: ${form.date}` : 'Yangi tadbir yarating' }}
              </p>
            </div>
          </div>
          <div class="d-flex gap-3 align-center flex-wrap">
            <LangTabs v-model="lang" />
            <VDivider vertical class="mx-1" style="height:28px" />
            <VBtn variant="text" color="secondary" size="small" :to="{ name: 'events' }">Bekor qilish</VBtn>
            <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">Saqlash</VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" rounded />

    <VRow>
      <!-- Left column -->
      <VCol cols="12" md="8">

        <!-- Basic info -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-calendar-event" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Asosiy ma'lumotlar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VRow>
              <VCol cols="12">
                <VTextField
                  :model-value="form[F.title]"
                  @update:model-value="v => (form[F.title] = v)"
                  :label="lang === 'uz' ? 'Sarlavha *' : lang === 'ru' ? 'Заголовок' : 'Title'"
                  :error-messages="lang === 'uz' ? errors.title : ''"
                  variant="outlined" density="comfortable"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.publishDate"
                  label="E'lon sanasi"
                  type="date"
                  prepend-inner-icon="tabler-calendar-plus"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.date"
                  label="Tadbir sanasi"
                  type="date"
                  prepend-inner-icon="tabler-calendar"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Description -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-article" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Tavsif</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <AppHtmlEditor
              :key="lang"
              :model-value="form[F.description]"
              @update:model-value="v => (form[F.description] = v)"
              :placeholder="lang === 'uz' ? 'Tadbir haqida yozing...' : lang === 'ru' ? 'О мероприятии...' : 'About the event...'"
            />
          </VCardText>
        </VCard>

        <!-- Details -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-info-circle" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Tafsilotlar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.location"
                  label="Joylashuv"
                  prepend-inner-icon="tabler-map-pin"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.apply_url"
                  label="Ariza havola"
                  prepend-inner-icon="tabler-link"
                  variant="outlined"
                  density="comfortable"
                  hint="https://... formatida to'liq URL kiriting"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Speakers -->
        <VCard elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-microphone-2" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Ma'ruzachilar</VCardTitle>
            <template #append>
              <VBtn size="x-small" variant="tonal" color="primary" prepend-icon="tabler-plus" @click="addSpeaker">
                Qo'shish
              </VBtn>
            </template>
          </VCardItem>
          <VCardText class="pt-3">
            <div v-if="form.speaker.length === 0" class="d-flex flex-column align-center py-6 text-medium-emphasis gap-2">
              <VIcon icon="tabler-users" size="32" opacity="0.4" />
              <p class="text-body-2 mb-0">Ma'ruzachi qo'shilmagan</p>
              <VBtn size="small" variant="tonal" color="primary" prepend-icon="tabler-plus" @click="addSpeaker">
                Birinchi ma'ruzachi qo'shish
              </VBtn>
            </div>

            <div
              v-for="(spk, i) in form.speaker"
              :key="i"
              class="mb-3 pa-4 rounded-lg"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); background: rgba(var(--v-theme-surface-variant), 0.3)"
            >
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-2">
                  <VAvatar size="24" color="primary" variant="tonal">
                    <span class="text-caption font-weight-bold">{{ i + 1 }}</span>
                  </VAvatar>
                  <span class="text-body-2 font-weight-medium">{{ spk.name || `Ma'ruzachi ${i + 1}` }}</span>
                </div>
                <VBtn icon="tabler-trash" size="x-small" variant="text" color="error" @click="removeSpeaker(i)" />
              </div>
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="spk.name"
                    label="Ismi"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="tabler-user"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="spk.designation"
                    label="Lavozim / Unvon"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="tabler-briefcase"
                  />
                </VCol>
                <VCol cols="12">
                  <FormUpload
                    v-model="spk.image"
                    :name="`speaker_image_${i}`"
                    label="Ma'ruzachi rasmi yuklash"
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

        <!-- Cover image -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon icon="tabler-photo" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Asosiy rasm</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <FormUpload
              v-model="form.image"
              name="image"
              label="Rasm yuklash (16:9 nisbat tavsiya)"
              upload-service-name="events"
            />
          </VCardText>
        </VCard>

        <!-- Quick info -->
        <VCard elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon icon="tabler-list-details" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Qisqa ma'lumot</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <div class="d-flex flex-column gap-2">
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-calendar" size="15" color="medium-emphasis" />
                <span class="text-caption text-medium-emphasis">Tadbir sanasi:</span>
                <span class="text-caption font-weight-medium">{{ form.date || '—' }}</span>
              </div>
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-map-pin" size="15" color="medium-emphasis" />
                <span class="text-caption text-medium-emphasis">Joylashuv:</span>
                <span class="text-caption font-weight-medium text-truncate">{{ form.location || '—' }}</span>
              </div>
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-users" size="15" color="medium-emphasis" />
                <span class="text-caption text-medium-emphasis">Ma'ruzachilar:</span>
                <span class="text-caption font-weight-medium">{{ form.speaker.length }} ta</span>
              </div>
            </div>
          </VCardText>
        </VCard>

      </VCol>
    </VRow>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="bottom right">
      <div class="d-flex align-center gap-2">
        <VIcon :icon="snackbar.color === 'success' ? 'tabler-check' : 'tabler-alert-circle'" size="18" />
        {{ snackbar.text }}
      </div>
    </VSnackbar>
  </section>
</template>
