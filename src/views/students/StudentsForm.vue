<script setup>
import FormUpload from '@/components/form/FormUpload.vue'
import FormFileUpload from '@/components/form/FormFileUpload.vue'
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import { studentsApi } from '@/services/students/students.service'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

const isEdit      = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading  = ref(false)
const snackbar    = reactive({ show: false, text: '', color: 'success' })

const form = reactive({
  title:        '',
  image:        null,
  direction:    '',
  achievement:  '',
  bio:          '',
  interest:     [],
  gmail:        '',
  portfolio:    '',
  certificates: [],
  articles:     [],
  abstracts:    [],
})

const errors = reactive({ title: '' })

function validate() {
  errors.title = form.title.trim() ? '' : 'Majburiy maydon'
  return !errors.title
}

function addCertificate()     { form.certificates.push({ title: '', issuer: '', year: '', url: '' }) }
function removeCertificate(i) { form.certificates.splice(i, 1) }

function addArticle()     { form.articles.push({ title: '', journal: '', year: '', url: '' }) }
function removeArticle(i) { form.articles.splice(i, 1) }

function addAbstract()     { form.abstracts.push({ title: '', year: '', url: '' }) }
function removeAbstract(i) { form.abstracts.splice(i, 1) }

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await studentsApi.findOne({ params: { id } })
    const r = data.result
    Object.assign(form, {
      title:        r.title        || '',
      image:        r.image        || null,
      direction:    r.direction    || '',
      achievement:  r.achievement  || '',
      bio:          r.bio          || '',
      interest:     Array.isArray(r.interest) ? r.interest : [],
      gmail:        r.gmail        || '',
      portfolio:    r.portfolio    || '',
      certificates: Array.isArray(r.certificates)
        ? r.certificates.map(c => ({ title: c.title || '', issuer: c.issuer || '', year: c.year || '', url: c.url || '' }))
        : [],
      articles: Array.isArray(r.articles)
        ? r.articles.map(a => ({ title: a.title || '', journal: a.journal || '', year: a.year || '', url: a.url || '' }))
        : [],
      abstracts: Array.isArray(r.abstracts)
        ? r.abstracts.map(a => ({ title: a.title || '', year: a.year || '', url: a.url || '' }))
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
    const payload = { type: 'student', draft: false, ...form }
    if (isEdit.value) {
      await studentsApi.update({ params: { id: route.params.id, ...payload } })
      snackbar.text = "O'quvchi yangilandi"
    } else {
      await studentsApi.create({ params: payload })
      snackbar.text = "O'quvchi yaratildi"
    }
    snackbar.color = 'success'
    snackbar.show  = true
    setTimeout(() => router.push({ name: 'students' }), 800)
  } catch (e) {
    console.error(e)
    snackbar.text  = 'Xatolik yuz berdi'
    snackbar.color = 'error'
    snackbar.show  = true
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
    <VCard class="mb-6" elevation="0" border>
      <VCardText class="py-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <VBtn icon="tabler-arrow-left" variant="text" size="small" :to="{ name: 'students' }" />
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">
                {{ isEdit ? "O'quvchini tahrirlash" : "Yangi o'quvchi" }}
              </h2>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ isEdit ? `ID: ${route.params.id}` : "Ma'lumotlarni to'ldiring" }}
              </p>
            </div>
          </div>
          <div class="d-flex gap-2">
            <VBtn variant="text" color="secondary" size="small" :to="{ name: 'students' }">Bekor qilish</VBtn>
            <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
              Saqlash
            </VBtn>
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
            <template #prepend><VIcon icon="tabler-user-star" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Asosiy ma'lumotlar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.title"
                  label="To'liq ismi *"
                  :error-messages="errors.title"
                  variant="outlined"
                  density="comfortable"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.direction"
                  label="Yo'nalish / Mutaxassislik"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="form.achievement"
                  label="Yutuq / Muvaffaqiyat"
                  rows="3"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Bio -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-article" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Biografiya</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <AppHtmlEditor v-model="form.bio" placeholder="Talaba haqida qisqacha ma'lumot kiriting..." />
          </VCardText>
        </VCard>

        <!-- Interests -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-bulb" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Qiziqishlar / Yo'nalishlar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <RepeatableList
              v-model="form.interest"
              label="Qiziqishlar"
              placeholder="Qiziqish qo'shing..."
            />
          </VCardText>
        </VCard>

        <!-- Contacts -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-at" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Aloqa va havolalar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.gmail"
                  label="Gmail"
                  prepend-inner-icon="tabler-brand-gmail"
                  variant="outlined"
                  density="comfortable"
                  type="email"
                  hint="example@gmail.com"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.portfolio"
                  label="Portfolio / LinkedIn"
                  prepend-inner-icon="tabler-world"
                  variant="outlined"
                  density="comfortable"
                  hint="https://... formatida to'liq URL"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Certificates -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-certificate" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Sertifikatlar</VCardTitle>
            <template #append>
              <VBtn size="x-small" variant="tonal" color="primary" prepend-icon="tabler-plus" @click="addCertificate">
                Qo'shish
              </VBtn>
            </template>
          </VCardItem>
          <VCardText class="pt-3">
            <div v-if="!form.certificates.length" class="d-flex flex-column align-center py-6 gap-2 text-medium-emphasis">
              <VIcon icon="tabler-certificate" size="32" opacity="0.3" />
              <p class="text-body-2 mb-0">Sertifikat qo'shilmagan</p>
            </div>
            <div
              v-for="(c, i) in form.certificates"
              :key="i"
              class="mb-3 pa-3 rounded-lg"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
            >
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-2">
                  <VAvatar size="22" color="primary" variant="tonal">
                    <span class="text-caption font-weight-bold">{{ i + 1 }}</span>
                  </VAvatar>
                  <span class="text-body-2 font-weight-medium">{{ c.title || `Sertifikat ${i + 1}` }}</span>
                </div>
                <VBtn icon="tabler-trash" size="x-small" variant="text" color="error" @click="removeCertificate(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="5">
                  <VTextField v-model="c.title" label="Sarlavha" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="12" md="5">
                  <VTextField v-model="c.issuer" label="Berilgan tashkilot" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="6" md="2">
                  <VTextField v-model="c.year" label="Yil" density="compact" variant="outlined" type="number" />
                </VCol>
                <VCol cols="12">
                  <FormFileUpload
                    v-model="c.url"
                    upload-service-name="students"
                    accept="image/*,.pdf"
                    label="Sertifikat yuklash (rasm yoki PDF)"
                  />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Articles -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-file-text" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Maqolalar</VCardTitle>
            <template #append>
              <VBtn size="x-small" variant="tonal" color="primary" prepend-icon="tabler-plus" @click="addArticle">
                Qo'shish
              </VBtn>
            </template>
          </VCardItem>
          <VCardText class="pt-3">
            <div v-if="!form.articles.length" class="d-flex flex-column align-center py-6 gap-2 text-medium-emphasis">
              <VIcon icon="tabler-file-text" size="32" opacity="0.3" />
              <p class="text-body-2 mb-0">Maqola qo'shilmagan</p>
            </div>
            <div
              v-for="(a, i) in form.articles"
              :key="i"
              class="mb-3 pa-3 rounded-lg"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
            >
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-2">
                  <VAvatar size="22" color="primary" variant="tonal">
                    <span class="text-caption font-weight-bold">{{ i + 1 }}</span>
                  </VAvatar>
                  <span class="text-body-2 font-weight-medium">{{ a.title || `Maqola ${i + 1}` }}</span>
                </div>
                <VBtn icon="tabler-trash" size="x-small" variant="text" color="error" @click="removeArticle(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="5">
                  <VTextField v-model="a.title" label="Sarlavha" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="12" md="5">
                  <VTextField v-model="a.journal" label="Jurnal / To'plam" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="6" md="2">
                  <VTextField v-model="a.year" label="Yil" density="compact" variant="outlined" type="number" />
                </VCol>
                <VCol cols="12">
                  <FormFileUpload
                    v-model="a.url"
                    upload-service-name="students"
                    accept=".pdf,.doc,.docx"
                    label="Maqola faylini yuklang (PDF)"
                  />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Abstracts -->
        <VCard elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-notes" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Tezislar</VCardTitle>
            <template #append>
              <VBtn size="x-small" variant="tonal" color="primary" prepend-icon="tabler-plus" @click="addAbstract">
                Qo'shish
              </VBtn>
            </template>
          </VCardItem>
          <VCardText class="pt-3">
            <div v-if="!form.abstracts.length" class="d-flex flex-column align-center py-6 gap-2 text-medium-emphasis">
              <VIcon icon="tabler-notes" size="32" opacity="0.3" />
              <p class="text-body-2 mb-0">Tezis qo'shilmagan</p>
            </div>
            <div
              v-for="(a, i) in form.abstracts"
              :key="i"
              class="mb-3 pa-3 rounded-lg"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
            >
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-2">
                  <VAvatar size="22" color="primary" variant="tonal">
                    <span class="text-caption font-weight-bold">{{ i + 1 }}</span>
                  </VAvatar>
                  <span class="text-body-2 font-weight-medium">{{ a.title || `Tezis ${i + 1}` }}</span>
                </div>
                <VBtn icon="tabler-trash" size="x-small" variant="text" color="error" @click="removeAbstract(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="10">
                  <VTextField v-model="a.title" label="Sarlavha" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="6" md="2">
                  <VTextField v-model="a.year" label="Yil" density="compact" variant="outlined" type="number" />
                </VCol>
                <VCol cols="12">
                  <FormFileUpload
                    v-model="a.url"
                    upload-service-name="students"
                    accept=".pdf,.doc,.docx"
                    label="Tezis faylini yuklang (PDF)"
                  />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

      </VCol>

      <!-- Right column -->
      <VCol cols="12" md="4">
        <VCard elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend><VIcon icon="tabler-photo" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Profil rasmi</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <FormUpload
              v-model="form.image"
              name="image"
              label="Profil rasmini yuklang"
              upload-service-name="students"
              crop-ratio="1:1"
            />
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
