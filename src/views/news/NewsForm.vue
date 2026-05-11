<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import VideoUpload from '@/components/form/VideoUpload.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import LangTabs from '@/components/LangTabs.vue'
import { newsApi } from '@/services/news/news.service'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

const isEdit      = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading  = ref(false)
const lang        = ref('uz')
const snackbar    = reactive({ show: false, text: '', color: 'success' })

const CATEGORIES = ['Tadbir', "E'lon", 'Ilmiy', 'Xalqaro', 'Umumiy']
const videoTab   = ref('url')

const form = reactive({
  // UZ (default)
  title: '', description: '', content: '',
  // RU
  title_ru: '', description_ru: '', content_ru: '',
  // EN
  title_en: '', description_en: '', content_en: '',
  // non-translatable
  slug: '', image: null, videoUrl: '', gallery: [],
  author: '', categories: [], tags: [],
  draft: true, featured: false,
  publishedAt: new Date().toISOString().slice(0, 10),
})

const errors = reactive({ title: '', slug: '', content: '' })

// Computed: current lang field names
const F = computed(() => ({
  title:       lang.value === 'uz' ? 'title'       : `title_${lang.value}`,
  description: lang.value === 'uz' ? 'description' : `description_${lang.value}`,
  content:     lang.value === 'uz' ? 'content'     : `content_${lang.value}`,
}))

const descCount = computed(() => (form[F.value.description] || '').length)

// Auto-slug (UZ only)
watch(() => form.title, val => {
  if (!isEdit.value && lang.value === 'uz') {
    form.slug = val.toLowerCase().trim()
      .replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/--+/g, '-')
  }
})

const wasPublished = ref(false)
watch(() => form.draft, val => {
  if (!val && !wasPublished.value) {
    form.publishedAt   = new Date().toISOString().slice(0, 10)
    wasPublished.value = true
  }
})

function validate() {
  let ok = true
  errors.title = form.title.trim() ? '' : "UZ sarlavha majburiy"
  if (errors.title) ok = false
  if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
    errors.slug = 'Faqat kichik harf, raqam va defis'; ok = false
  } else errors.slug = ''
  if (!form.draft) {
    const plain = form.content.replace(/<[^>]+>/g, '').trim()
    if (plain.length < 100) { errors.content = "Kontent kamida 100 ta belgi (UZ)"; ok = false }
    else errors.content = ''
  } else errors.content = ''
  return ok
}

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await newsApi.findOne({ params: { id } })
    const r = data.result ?? data
    Object.assign(form, {
      title: r.title || '', description: r.description || '', content: r.content || '',
      title_ru: r.title_ru || '', description_ru: r.description_ru || '', content_ru: r.content_ru || '',
      title_en: r.title_en || '', description_en: r.description_en || '', content_en: r.content_en || '',
      slug: r.slug || '', image: r.image || null, videoUrl: r.videoUrl || '',
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
      author: r.author || '',
      categories: Array.isArray(r.categories) ? r.categories : [],
      tags: Array.isArray(r.tags) ? r.tags : [],
      draft: r.draft ?? true, featured: r.featured ?? false,
      publishedAt: r.publishedAt ? r.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    })
    if (!r.draft) wasPublished.value = true
  } catch (e) { console.error(e) }
  finally { pageLoading.value = false }
}

async function submit() {
  if (!validate()) return
  btnLoading.value = true
  try {
    const payload = {
      title: form.title, description: form.description, content: form.content,
      title_ru: form.title_ru, description_ru: form.description_ru, content_ru: form.content_ru,
      title_en: form.title_en, description_en: form.description_en, content_en: form.content_en,
      slug: form.slug || undefined, image: form.image,
      videoUrl: form.videoUrl || undefined,
      gallery: form.gallery.filter(Boolean),
      author: form.author, categories: form.categories, tags: form.tags,
      draft: form.draft, featured: form.featured, publishedAt: form.publishedAt,
      type: 'news',
    }
    if (isEdit.value) {
      await newsApi.update({ params: { id: route.params.id, ...payload } })
      snackbar.text = 'Yangilik yangilandi'
    } else {
      await newsApi.create({ params: payload })
      snackbar.text = 'Yangilik yaratildi'
    }
    snackbar.color = 'success'; snackbar.show = true
    setTimeout(() => router.push({ name: 'news' }), 900)
  } catch (e) {
    console.error(e)
    snackbar.text = 'Xatolik yuz berdi'; snackbar.color = 'error'; snackbar.show = true
  } finally { btnLoading.value = false }
}

onMounted(() => { if (isEdit.value) fetchItem(route.params.id) })
</script>

<template>
  <section>
    <!-- Sticky header -->
    <VCard class="mb-6" elevation="0" border style="position: sticky; top: 12px; z-index: 100;">
      <VCardText class="py-3">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <VBtn icon="tabler-arrow-left" variant="text" size="small" :to="{ name: 'news' }" />
            <div>
              <div class="d-flex align-center gap-2">
                <h2 class="text-h6 font-weight-bold mb-0">
                  {{ isEdit ? 'Yangilikni tahrirlash' : 'Yangi yangilik' }}
                </h2>
                <VChip :color="form.draft ? 'warning' : 'success'" size="x-small" variant="tonal">
                  {{ form.draft ? 'Qoralama' : 'Nashr' }}
                </VChip>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">{{ form.publishedAt }}</p>
            </div>
          </div>
          <div class="d-flex gap-3 align-center flex-wrap">
            <LangTabs v-model="lang" />
            <VDivider vertical class="mx-1" style="height:28px" />
            <VBtn variant="text" color="secondary" size="small" :to="{ name: 'news' }">Bekor qilish</VBtn>
            <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
              Saqlash
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" rounded />

    <VRow>
      <!-- Left -->
      <VCol cols="12" md="8">

        <!-- Basic info -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-news" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">
              Asosiy ma'lumotlar
              <VChip size="x-small" class="ms-2" variant="tonal">{{ lang.toUpperCase() }}</VChip>
            </VCardTitle>
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

              <!-- Slug & meta — UZ only -->
              <template v-if="lang === 'uz'">
                <VCol cols="12">
                  <VTextField
                    v-model="form.slug" label="Slug (URL)"
                    :error-messages="errors.slug"
                    variant="outlined" density="comfortable"
                    hint="Faqat kichik harf, raqam va defis" persistent-hint
                    @input="errors.slug = ''"
                  >
                    <template #prepend-inner>
                      <span class="text-caption text-medium-emphasis me-1">/news/</span>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="form.author" label="Muallif"
                    prepend-inner-icon="tabler-user" variant="outlined" density="comfortable" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="form.publishedAt" label="Nashr sanasi" type="date"
                    prepend-inner-icon="tabler-calendar" variant="outlined" density="comfortable" />
                </VCol>
              </template>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Description -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-align-left" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">
              {{ lang === 'uz' ? 'Qisqa tavsif' : lang === 'ru' ? 'Краткое описание' : 'Short description' }}
            </VCardTitle>
            <template #append>
              <span class="text-caption" :class="descCount > 300 ? 'text-error font-weight-bold' : 'text-medium-emphasis'">
                {{ descCount }}/300
              </span>
            </template>
          </VCardItem>
          <VCardText class="pt-4">
            <VTextarea
              :model-value="form[F.description]"
              @update:model-value="v => (form[F.description] = v)"
              :placeholder="lang === 'uz' ? 'Qisqa tavsif...' : lang === 'ru' ? 'Краткое описание...' : 'Short description...'"
              rows="3" variant="outlined" density="comfortable" hide-details
              :error="descCount > 300"
            />
          </VCardText>
        </VCard>

        <!-- Content -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-article" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">
              {{ lang === 'uz' ? "To'liq kontent" : lang === 'ru' ? 'Полный текст' : 'Full content' }}
            </VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VAlert v-if="errors.content && lang === 'uz'" type="error" variant="tonal"
              density="compact" class="mb-3" :text="errors.content" />
            <AppHtmlEditor
              :key="lang"
              :model-value="form[F.content]"
              @update:model-value="v => (form[F.content] = v)"
              :placeholder="lang === 'uz' ? 'Maqola matni...' : lang === 'ru' ? 'Текст статьи...' : 'Article text...'"
            />
          </VCardText>
        </VCard>

        <!-- Tags (lang-independent) -->
        <VCard elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend><VIcon icon="tabler-tags" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Teglar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <RepeatableList v-model="form.tags" label="Teglar" placeholder="Teg qo'shing..." />
          </VCardText>
        </VCard>

      </VCol>

      <!-- Right column (lang-independent) -->
      <VCol cols="12" md="4">

        <!-- Publish -->
        <VCard class="mb-4" elevation="0"
          :border="form.draft" :color="form.draft ? undefined : 'success'"
          :variant="form.draft ? 'outlined' : 'tonal'">
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon :icon="form.draft ? 'tabler-file-pencil' : 'tabler-circle-check'"
                :color="form.draft ? 'warning' : 'success'" size="18" />
            </template>
            <VCardTitle class="text-body-1">{{ form.draft ? 'Qoralama' : 'Nashr qilingan' }}</VCardTitle>
            <VCardSubtitle class="text-caption">
              {{ form.draft ? "Faqat admin ko'radi" : `${form.publishedAt} · saytda ko'rinadi` }}
            </VCardSubtitle>
          </VCardItem>
          <VDivider />
          <VCardText class="pt-2">
            <div class="d-flex align-center justify-space-between py-2">
              <div>
                <p class="text-body-2 font-weight-medium mb-0">Nashr holati</p>
                <p class="text-caption mb-0" :class="form.draft ? 'text-warning' : 'text-success'">
                  {{ form.draft ? "Yoqish uchun o'ngga suring" : "O'chirish uchun chapga suring" }}
                </p>
              </div>
              <VSwitch :model-value="!form.draft" color="success" hide-details
                @update:model-value="v => (form.draft = !v)" />
            </div>
            <VDivider />
            <div class="d-flex align-center justify-space-between py-2">
              <div>
                <p class="text-body-2 font-weight-medium mb-0">Slayder</p>
                <p class="text-caption text-medium-emphasis mb-0">Bosh sahifada ko'rsatish</p>
              </div>
              <VSwitch v-model="form.featured" color="warning" hide-details />
            </div>
          </VCardText>
        </VCard>

        <!-- Cover image -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend><VIcon icon="tabler-photo" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Muqova rasmi</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <FormUpload v-model="form.image" name="image"
              label="Rasm yuklash (16:9 nisbat tavsiya)" upload-service-name="news" />
            <VAlert v-if="!form.draft && !form.image" type="warning" variant="tonal"
              density="compact" class="mt-3" icon="tabler-alert-triangle"
              text="Nashr uchun muqova rasmi tavsiya etiladi" />
          </VCardText>
        </VCard>

        <!-- Video -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend><VIcon icon="tabler-video" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Video</VCardTitle>
          </VCardItem>
          <VCardText class="pt-3">
            <div class="d-flex gap-1 mb-4">
              <VBtn :variant="videoTab === 'url' ? 'tonal' : 'text'" :color="videoTab === 'url' ? 'primary' : 'default'"
                size="small" prepend-icon="tabler-link" @click="videoTab = 'url'">URL</VBtn>
              <VBtn :variant="videoTab === 'file' ? 'tonal' : 'text'" :color="videoTab === 'file' ? 'primary' : 'default'"
                size="small" prepend-icon="tabler-upload" @click="videoTab = 'file'">Qurilmadan</VBtn>
            </div>
            <div v-if="videoTab === 'url'">
              <VTextField v-model="form.videoUrl" placeholder="https://youtube.com/watch?v=..."
                prepend-inner-icon="tabler-brand-youtube" variant="outlined" density="comfortable" clearable hide-details />
            </div>
            <div v-else><VideoUpload v-model="form.videoUrl" /></div>
          </VCardText>
        </VCard>

        <!-- Gallery -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend><VIcon icon="tabler-photo-album" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Fotogalereya</VCardTitle>
            <template #append>
              <VChip v-if="form.gallery.length" size="x-small" color="primary" variant="tonal">{{ form.gallery.length }} ta</VChip>
            </template>
          </VCardItem>
          <VCardText class="pt-2">
            <FormUpload v-model="form.gallery" name="gallery"
              label="Galereya rasmlari" upload-service-name="news" :multiple="true" />
          </VCardText>
        </VCard>

        <!-- Category -->
        <VCard elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend><VIcon icon="tabler-category" color="primary" size="18" /></template>
            <VCardTitle class="text-body-1">Kategoriya</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <VSelect v-model="form.categories" :items="CATEGORIES" placeholder="Kategoriyalar tanlang"
              multiple chips closable-chips clearable variant="outlined" density="comfortable" hide-details />
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
