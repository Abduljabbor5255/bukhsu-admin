<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import FormFileUpload from '@/components/form/FormFileUpload.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import LangTabs from '@/components/LangTabs.vue'
import { teachersApi } from '@/services/teachers/teachers.service'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading = ref(false)
const lang = ref('uz')
const snackbar = reactive({ show: false, text: '', color: 'success' })

const form = reactive({
  title: '',
  image: null,
  category: '',
  course: '',
  position: '',    position_ru: '', position_en: '',
  degree: '',      degree_ru: '',   degree_en: '',
  department: '',
  email: '',
  short_info: '', short_info_ru: '', short_info_en: '',
  bio: '',         bio_ru: '',       bio_en: '',
  stats: { staj: '', ped_staj: '', ilmiy_ishlar: '', monografiyalar: '', shartnomalar: '' },
  education:  [],
  experience: [],
  articles: [],
  certificates: [],
  abstracts: [],
  projects: [],
  teaching: [],
})

const F = computed(() => ({
  position:   lang.value === 'uz' ? 'position'   : `position_${lang.value}`,
  degree:     lang.value === 'uz' ? 'degree'     : `degree_${lang.value}`,
  short_info: lang.value === 'uz' ? 'short_info' : `short_info_${lang.value}`,
  bio:        lang.value === 'uz' ? 'bio'        : `bio_${lang.value}`,
}))

const errors = reactive({ title: '' })

function validate() {
  errors.title = form.title.trim() ? '' : 'Majburiy maydon'
  return !errors.title
}

// --- Array helpers ---
function addArticle()     { form.articles.push({ title: '', journal: '', year: '', url: '' }) }
function removeArticle(i) { form.articles.splice(i, 1) }

function addCertificate()     { form.certificates.push({ title: '', issuer: '', year: '', url: '' }) }
function removeCertificate(i) { form.certificates.splice(i, 1) }

function addAbstract()     { form.abstracts.push({ title: '', year: '', url: '' }) }
function removeAbstract(i) { form.abstracts.splice(i, 1) }

function addProject()     { form.projects.push({ title: '', description: '', year: '', url: '' }) }
function removeProject(i) { form.projects.splice(i, 1) }

function addTeaching()     { form.teaching.push({ title: '', code: '', level: '' }) }
function removeTeaching(i) { form.teaching.splice(i, 1) }


function addEducation()     { form.education.push({ year: '', degree: '', university: '' }) }
function removeEducation(i) { form.education.splice(i, 1) }

function addExperience()     { form.experience.push({ year_from: '', year_to: '', position: '', organization: '' }) }
function removeExperience(i) { form.experience.splice(i, 1) }

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await teachersApi.findOne({ params: { id } })
    const r = data.result ?? data
    Object.assign(form, {
      title: r.title || '', image: r.image || null,
      course: r.course || '', category: r.category || '',
      department: r.department || '', email: r.email || '',
      position: r.position || '', position_ru: r.position_ru || '', position_en: r.position_en || '',
      degree: r.degree || '',     degree_ru: r.degree_ru || '',     degree_en: r.degree_en || '',
      short_info: r.short_info || '', short_info_ru: r.short_info_ru || '', short_info_en: r.short_info_en || '',
      bio: r.bio || '',               bio_ru: r.bio_ru || '',               bio_en: r.bio_en || '',
      stats: {
        staj: r.stats?.staj ?? '', ped_staj: r.stats?.ped_staj ?? '',
        ilmiy_ishlar: r.stats?.ilmiy_ishlar ?? '', monografiyalar: r.stats?.monografiyalar ?? '',
        shartnomalar: r.stats?.shartnomalar ?? '',
      },
      education:    Array.isArray(r.education)    ? r.education.map(e => ({ year: e.year||'', degree: e.degree||'', university: e.university||'' })) : [],
      experience:   Array.isArray(r.experience)   ? r.experience.map(e => ({ year_from: e.year_from||'', year_to: e.year_to||'', position: e.position||'', organization: e.organization||'' })) : [],
      articles:     Array.isArray(r.articles)     ? r.articles.map(a => ({ title: a.title||'', journal: a.journal||'', year: a.year||'', url: a.url||'' })) : [],
      certificates: Array.isArray(r.certificates) ? r.certificates.map(c => ({ title: c.title||'', issuer: c.issuer||'', year: c.year||'', url: c.url||'' })) : [],
      abstracts:    Array.isArray(r.abstracts)    ? r.abstracts.map(a => ({ title: a.title||'', year: a.year||'', url: a.url||'' })) : [],
      projects:     Array.isArray(r.projects)     ? r.projects.map(p => ({ title: p.title||'', description: p.description||'', year: p.year||'', url: p.url||'' })) : [],
      teaching:     Array.isArray(r.teaching)     ? r.teaching.map(c => ({ title: c.title||'', code: c.code||'', level: c.level||'' })) : [],
    })
  } catch {
    snackbar.text = "Ma'lumotlarni yuklashda xatolik"; snackbar.color = 'error'; snackbar.show = true
  } finally { pageLoading.value = false }
}

async function submit() {
  if (!validate()) return
  btnLoading.value = true
  try {
    const payload = { type: 'teacher', draft: false, ...form }
    if (isEdit.value) {
      await teachersApi.update({ params: { id: route.params.id, ...payload } })
      snackbar.text = "O'qituvchi yangilandi"
    } else {
      await teachersApi.create({ params: payload })
      snackbar.text = "O'qituvchi yaratildi"
    }
    snackbar.color = 'success'; snackbar.show = true
    setTimeout(() => router.push({ name: 'teachers' }), 800)
  } catch {
    snackbar.text = 'Saqlashda xatolik yuz berdi'; snackbar.color = 'error'; snackbar.show = true
  } finally { btnLoading.value = false }
}

onMounted(() => {
  if (isEdit.value) fetchItem(route.params.id)
})
</script>

<template>
  <section>
    <!-- Sticky header -->
    <VCard class="mb-6" elevation="0" border style="position: sticky; top: 12px; z-index: 100;">
      <VCardText class="py-3">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <VBtn icon="tabler-arrow-left" variant="text" size="small" :to="{ name: 'teachers' }" />
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">
                {{ isEdit ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi" }}
              </h2>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ isEdit ? `ID: ${route.params.id}` : "Ma'lumotlarni to'ldiring" }}
              </p>
            </div>
          </div>
          <div class="d-flex gap-3 align-center flex-wrap">
            <LangTabs v-model="lang" />
            <VDivider vertical class="mx-1" style="height:28px" />
            <VBtn variant="text" color="secondary" size="small" :to="{ name: 'teachers' }">Bekor qilish</VBtn>
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
            <template #prepend><VIcon icon="tabler-user" color="primary" size="18" /></template>
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
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.category"
                  label="Toifasi"
                  :items="['Academic', 'Research', 'Staff']"
                  variant="outlined"
                  density="comfortable"
                  clearable
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  :model-value="form[F.position]"
                  @update:model-value="v => (form[F.position] = v)"
                  :label="lang === 'uz' ? 'Lavozim' : lang === 'ru' ? 'Должность' : 'Position'"
                  variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  :model-value="form[F.degree]"
                  @update:model-value="v => (form[F.degree] = v)"
                  :label="lang === 'uz' ? 'Ilmiy daraja' : lang === 'ru' ? 'Учёная степень' : 'Academic degree'"
                  variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.course" label="Fan / Kurs" variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.department" label="Kafedra / Bo'lim" variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.email" label="Email" prepend-inner-icon="tabler-mail" type="email" variant="outlined" density="comfortable" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Short info -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-id" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Qisqa ma'lumot</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VTextField
              :model-value="form[F.short_info]"
              @update:model-value="v => (form[F.short_info] = v)"
              :label="lang === 'uz' ? 'Qisqa tarjimai hol' : lang === 'ru' ? 'Краткая биография' : 'Short bio'"
              variant="outlined"
              density="comfortable"
              hint="Masalan: 2023-yilda PhD himoya qilgan, 12 yillik tajribaga ega"
              persistent-hint
            />
          </VCardText>
        </VCard>

        <!-- Bio -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-article" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Biografiya</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <AppHtmlEditor
              :key="lang"
              :model-value="form[F.bio]"
              @update:model-value="v => (form[F.bio] = v)"
              :placeholder="lang === 'uz' ? 'Biografiyani kiriting...' : lang === 'ru' ? 'Введите биографию...' : 'Enter biography...'"
            />
          </VCardText>
        </VCard>

        <!-- Stats -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-chart-bar" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Statistika</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VRow>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.staj"           label="Umumiy staj (yil)"       type="number" min="0" variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.ped_staj"       label="Pedagogik staj (yil)"    type="number" min="0" variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.ilmiy_ishlar"   label="Ilmiy ishlar"            type="number" min="0" variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.monografiyalar" label="Monografiyalar"           type="number" min="0" variant="outlined" density="comfortable" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.shartnomalar"   label="Hamkorlik shartnomalari" type="number" min="0" variant="outlined" density="comfortable" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Education -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Ta'lim</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addEducation">Qo'shish</VBtn>
            </div>
            <div v-if="!form.education.length" class="text-center pa-4 text-medium-emphasis text-body-2">
              Hali ta'lim ma'lumoti qo'shilmagan
            </div>
            <div
              v-for="(e, i) in form.education"
              :key="i"
              class="mb-3 pa-3 rounded"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;"
            >
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeEducation(i)" />
              </div>
              <VRow dense>
                <VCol cols="6" md="2">
                  <VTextField v-model="e.year" label="Yil" density="compact" variant="outlined" type="number" />
                </VCol>
                <VCol cols="6" md="4">
                  <VTextField v-model="e.degree" label="Daraja / Unvon" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="e.university" label="Muassasa" density="compact" variant="outlined" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Experience -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Mehnat faoliyati</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addExperience">Qo'shish</VBtn>
            </div>
            <div v-if="!form.experience.length" class="text-center pa-4 text-medium-emphasis text-body-2">
              Hali ish tajribasi qo'shilmagan
            </div>
            <div
              v-for="(e, i) in form.experience"
              :key="i"
              class="mb-3 pa-3 rounded"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;"
            >
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeExperience(i)" />
              </div>
              <VRow dense>
                <VCol cols="6" md="2">
                  <VTextField v-model="e.year_from" label="Dan" density="compact" variant="outlined" type="number" />
                </VCol>
                <VCol cols="6" md="2">
                  <VTextField v-model="e.year_to" label="Gacha" density="compact" variant="outlined" />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="e.position" label="Lavozim" density="compact" />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="e.organization" label="Tashkilot / Kafedra" density="compact" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Articles -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Maqolalar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addArticle">Qo'shish</VBtn>
            </div>
            <div v-if="!form.articles.length" class="text-center pa-4 text-medium-emphasis text-body-2">Hali maqola qo'shilmagan</div>
            <div v-for="(a, i) in form.articles" :key="i" class="mb-3 pa-3 rounded" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeArticle(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="a.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="12" md="6"><VTextField v-model="a.journal" label="Jurnal" density="compact" /></VCol>
                <VCol cols="6" md="2"><VTextField v-model="a.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="12">
                  <FormFileUpload v-model="a.url" upload-service-name="teachers" accept=".pdf,.doc,.docx" label="Maqola faylini yuklang (PDF)" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Certificates -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Sertifikatlar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addCertificate">Qo'shish</VBtn>
            </div>
            <div v-if="!form.certificates.length" class="text-center pa-4 text-medium-emphasis text-body-2">Hali sertifikat qo'shilmagan</div>
            <div v-for="(c, i) in form.certificates" :key="i" class="mb-3 pa-3 rounded" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeCertificate(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="c.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="12" md="6"><VTextField v-model="c.issuer" label="Berilgan tashkilot" density="compact" /></VCol>
                <VCol cols="6" md="2"><VTextField v-model="c.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="12">
                  <FormFileUpload v-model="c.url" upload-service-name="teachers" accept="image/*,.pdf" label="Sertifikat yuklash (rasm yoki PDF)" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Abstracts -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Tezislar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addAbstract">Qo'shish</VBtn>
            </div>
            <div v-if="!form.abstracts.length" class="text-center pa-4 text-medium-emphasis text-body-2">Hali tezis qo'shilmagan</div>
            <div v-for="(a, i) in form.abstracts" :key="i" class="mb-3 pa-3 rounded" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeAbstract(i)" />
              </div>
              <VRow dense>
                <VCol cols="12"><VTextField v-model="a.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="6" md="2"><VTextField v-model="a.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="12">
                  <FormFileUpload v-model="a.url" upload-service-name="teachers" accept=".pdf,.doc,.docx" label="Tezis faylini yuklang (PDF)" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Projects -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Loyihalar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addProject">Qo'shish</VBtn>
            </div>
            <div v-if="!form.projects.length" class="text-center pa-4 text-medium-emphasis text-body-2">Hali loyiha qo'shilmagan</div>
            <div v-for="(p, i) in form.projects" :key="i" class="mb-3 pa-3 rounded" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeProject(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="p.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="p.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="12"><VTextField v-model="p.description" label="Tavsif" density="compact" /></VCol>
                <VCol cols="12">
                  <FormFileUpload v-model="p.url" upload-service-name="teachers" accept="image/*,.pdf,.doc,.docx" label="Loyiha faylini yuklang" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Teaching -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">O'qitiladigan fanlar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addTeaching">Qo'shish</VBtn>
            </div>
            <div v-if="!form.teaching.length" class="text-center pa-4 text-medium-emphasis text-body-2">Hali fan qo'shilmagan</div>
            <div v-for="(c, i) in form.teaching" :key="i" class="mb-3 pa-3 rounded" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeTeaching(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="c.title" label="Fan nomi" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="c.code" label="Kod (masalan: ECO201)" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="c.level" label="Daraja (Bakalavr...)" density="compact" /></VCol>
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
              upload-service-name="teachers"
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
