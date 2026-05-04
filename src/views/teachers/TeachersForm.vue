<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import FormFileUpload from '@/components/form/FormFileUpload.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import { teachersApi } from '@/services/teachers/teachers.service'
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
  category: '',
  course: '',
  position: '',
  degree: '',
  department: '',
  email: '',
  phone: '',
  location: '',
  short_info: '',
  bio: '',
  stats: { staj: '', ped_staj: '', ilmiy_ishlar: '', monografiyalar: '', shartnomalar: '' },
  interest: [],
  education:  [],
  experience: [],
  contracts:  [],
  articles: [],
  certificates: [],
  abstracts: [],
  projects: [],
  teaching: [],
  videos: [],
})

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

function addVideo()     { form.videos.push({ title: '', url: '', description: '' }) }
function removeVideo(i) { form.videos.splice(i, 1) }

function addEducation()     { form.education.push({ year: '', degree: '', university: '' }) }
function removeEducation(i) { form.education.splice(i, 1) }

function addExperience()     { form.experience.push({ year_from: '', year_to: '', position: '', organization: '' }) }
function removeExperience(i) { form.experience.splice(i, 1) }

function addContract()     { form.contracts.push({ name: '', year: '', topic: '' }) }
function removeContract(i) { form.contracts.splice(i, 1) }

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await teachersApi.findOne({ params: { id } })
    const r = data.result
    Object.assign(form, {
      title:        r.title || '',
      image:        r.image || null,
      course:       r.course || '',
      position:     r.position || '',
      degree:       r.degree || '',
      department:   r.department || '',
      email:        r.email || '',
      short_info:   r.short_info || '',
      bio:          r.bio || '',
      category:     r.category || '',
      phone:        r.phone || '',
      location:     r.location || '',
      stats: {
        staj:           r.stats?.staj           ?? '',
        ped_staj:       r.stats?.ped_staj       ?? '',
        ilmiy_ishlar:   r.stats?.ilmiy_ishlar   ?? '',
        monografiyalar: r.stats?.monografiyalar ?? '',
        shartnomalar:   r.stats?.shartnomalar   ?? '',
      },
      interest:     Array.isArray(r.interest) ? r.interest : [],
      education:    Array.isArray(r.education)   ? r.education.map(e => ({ year: e.year || '', degree: e.degree || '', university: e.university || '' })) : [],
      experience:   Array.isArray(r.experience)  ? r.experience.map(e => ({ year_from: e.year_from || '', year_to: e.year_to || '', position: e.position || '', organization: e.organization || '' })) : [],
      contracts:    Array.isArray(r.contracts)   ? r.contracts.map(c => ({ name: c.name || '', year: c.year || '', topic: c.topic || '' })) : [],
      articles:     Array.isArray(r.articles)     ? r.articles.map(a => ({ title: a.title || '', journal: a.journal || '', year: a.year || '', url: a.url || '' })) : [],
      certificates: Array.isArray(r.certificates) ? r.certificates.map(c => ({ title: c.title || '', issuer: c.issuer || '', year: c.year || '', url: c.url || '' })) : [],
      abstracts:    Array.isArray(r.abstracts)    ? r.abstracts.map(a => ({ title: a.title || '', year: a.year || '', url: a.url || '' })) : [],
      projects:     Array.isArray(r.projects)     ? r.projects.map(p => ({ title: p.title || '', description: p.description || '', year: p.year || '', url: p.url || '' })) : [],
      teaching:     Array.isArray(r.teaching)     ? r.teaching.map(c => ({ title: c.title || '', code: c.code || '', level: c.level || '' })) : [],
      videos:       Array.isArray(r.videos)       ? r.videos.map(v => ({ title: v.title || '', url: v.url || '', description: v.description || '' })) : [],
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
    const payload = { type: 'teacher', draft: false, ...form }
    if (isEdit.value) {
      await teachersApi.update({ params: { id: route.params.id, ...payload } })
      snackbarText.value = "O'qituvchi yangilandi"
    } else {
      await teachersApi.create({ params: payload })
      snackbarText.value = "O'qituvchi yaratildi"
    }
    isSnackbarVisible.value = true
    setTimeout(() => router.push({ name: 'teachers' }), 800)
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
        <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'teachers' }" />
        <h2 class="text-h4">{{ isEdit ? "O'qituvchini tahrirlash" : "O'qituvchi yaratish" }}</h2>
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
                  label="To'liq ismi *"
                  :error-messages="errors.title"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.category"
                  label="Toifasi"
                  :items="['Academic', 'Research', 'Staff']"
                  clearable
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.position" label="Lavozim" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.degree" label="Ilmiy daraja" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.course" label="Fan / Kurs" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.department" label="Kafedra / Bo'lim" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.email" label="Email" prepend-inner-icon="tabler-mail" type="email" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="form.phone" label="Telefon" prepend-inner-icon="tabler-phone" />
              </VCol>
              <VCol cols="12">
                <VTextField v-model="form.location" label="Joylashuv (xona, bino)" prepend-inner-icon="tabler-map-pin" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Bio -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Biografiya</p>
            <AppHtmlEditor v-model="form.bio" label="Biografiya" placeholder="Biografiyani kiriting..." />
          </VCardText>
        </VCard>

        <!-- Short info -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Qisqa ma'lumot</p>
            <VTextField
              v-model="form.short_info"
              label="Qisqa tarjimai hol (1–2 jumla)"
              placeholder="2023-yilda PhD himoya qilgan, 12 yillik tajribaga ega..."
            />
          </VCardText>
        </VCard>

        <!-- Stats -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Statistika</p>
            <VRow>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.staj"           label="Umumiy staj (yil)"      type="number" min="0" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.ped_staj"       label="Pedagogik staj (yil)"   type="number" min="0" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.ilmiy_ishlar"   label="Ilmiy ishlar soni"      type="number" min="0" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.monografiyalar" label="Monografiyalar"          type="number" min="0" />
              </VCol>
              <VCol cols="6" md="4">
                <VTextField v-model="form.stats.shartnomalar"   label="Hamkorlik shartnomalari" type="number" min="0" />
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
              style="background: rgba(var(--v-theme-on-surface), 0.04);"
            >
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeEducation(i)" />
              </div>
              <VRow dense>
                <VCol cols="6" md="2">
                  <VTextField v-model="e.year" label="Yil" density="compact" placeholder="2024" />
                </VCol>
                <VCol cols="6" md="4">
                  <VTextField v-model="e.degree" label="Daraja / Unvon" density="compact" placeholder="PhD, Magistr..." />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="e.university" label="Muassasa" density="compact" placeholder="Buxoro davlat universiteti" />
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
              style="background: rgba(var(--v-theme-on-surface), 0.04);"
            >
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeExperience(i)" />
              </div>
              <VRow dense>
                <VCol cols="6" md="2">
                  <VTextField v-model="e.year_from" label="Dan" density="compact" placeholder="2019" />
                </VCol>
                <VCol cols="6" md="2">
                  <VTextField v-model="e.year_to" label="Gacha" density="compact" placeholder="2022 / h.v." />
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

        <!-- Contracts -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Hamkorlik shartnomalari</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addContract">Qo'shish</VBtn>
            </div>
            <div v-if="!form.contracts.length" class="text-center pa-4 text-medium-emphasis text-body-2">
              Hali shartnoma qo'shilmagan
            </div>
            <div
              v-for="(c, i) in form.contracts"
              :key="i"
              class="mb-3 pa-3 rounded"
              style="background: rgba(var(--v-theme-on-surface), 0.04);"
            >
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeContract(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6">
                  <VTextField v-model="c.name" label="Tashkilot nomi" density="compact" />
                </VCol>
                <VCol cols="6" md="2">
                  <VTextField v-model="c.year" label="Yil" density="compact" type="number" />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="c.topic" label="Mavzu / Yo'nalish" density="compact" />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>

        <!-- Research interests -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Ilmiy qiziqishlar</p>
            <RepeatableList v-model="form.interest" label="Qiziqishlar" placeholder="Qiziqish qo'shish..." />
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
            <div v-for="(a, i) in form.articles" :key="i" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-on-surface), 0.04);">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeArticle(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="a.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="12" md="6"><VTextField v-model="a.journal" label="Jurnal" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="a.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="6" md="9">
                  <p class="text-caption text-medium-emphasis mb-1">Fayl (PDF)</p>
                  <FormFileUpload v-model="a.url" upload-service-name="teachers" accept=".pdf,.doc,.docx" label="Fayl yuklash" />
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
            <div v-for="(c, i) in form.certificates" :key="i" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-on-surface), 0.04);">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeCertificate(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="c.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="12" md="6"><VTextField v-model="c.issuer" label="Berilgan tashkilot" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="c.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="6" md="9">
                  <p class="text-caption text-medium-emphasis mb-1">Rasm yoki PDF</p>
                  <FormFileUpload v-model="c.url" upload-service-name="teachers" accept="image/*,.pdf" label="Fayl yuklash" />
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
            <div v-for="(a, i) in form.abstracts" :key="i" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-on-surface), 0.04);">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeAbstract(i)" />
              </div>
              <VRow dense>
                <VCol cols="12"><VTextField v-model="a.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="a.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="6" md="9">
                  <p class="text-caption text-medium-emphasis mb-1">Fayl (PDF)</p>
                  <FormFileUpload v-model="a.url" upload-service-name="teachers" accept=".pdf,.doc,.docx" label="Fayl yuklash" />
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
            <div v-for="(p, i) in form.projects" :key="i" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-on-surface), 0.04);">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeProject(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="p.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="6" md="3"><VTextField v-model="p.year" label="Yil" density="compact" type="number" /></VCol>
                <VCol cols="12"><VTextField v-model="p.description" label="Tavsif" density="compact" /></VCol>
                <VCol cols="12">
                  <p class="text-caption text-medium-emphasis mb-1">Fayl yoki rasm</p>
                  <FormFileUpload v-model="p.url" upload-service-name="teachers" accept="image/*,.pdf,.doc,.docx" label="Fayl yuklash" />
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
            <div v-for="(c, i) in form.teaching" :key="i" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-on-surface), 0.04);">
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

        <!-- Videos -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="text-overline text-medium-emphasis mb-0">Videolar</p>
              <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="addVideo">Qo'shish</VBtn>
            </div>
            <div v-if="!form.videos.length" class="text-center pa-4 text-medium-emphasis text-body-2">Hali video qo'shilmagan</div>
            <div v-for="(v, i) in form.videos" :key="i" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-on-surface), 0.04);">
              <div class="d-flex justify-end mb-2">
                <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="removeVideo(i)" />
              </div>
              <VRow dense>
                <VCol cols="12" md="6"><VTextField v-model="v.title" label="Sarlavha" density="compact" /></VCol>
                <VCol cols="12"><VTextField v-model="v.description" label="Tavsif" density="compact" /></VCol>
                <VCol cols="12">
                  <p class="text-caption text-medium-emphasis mb-1">Video fayl</p>
                  <FormFileUpload v-model="v.url" upload-service-name="teachers" accept="video/*" label="Video yuklash" />
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
            <p class="text-overline text-medium-emphasis mb-4">Profil rasmi</p>
            <FormUpload
              v-model="form.image"
              name="image"
              label="Rasm yuklash"
              upload-service-name="teachers"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar v-model="isSnackbarVisible" color="success">{{ snackbarText }}</VSnackbar>
  </section>
</template>
