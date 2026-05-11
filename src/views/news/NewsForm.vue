<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
import VideoUpload from '@/components/form/VideoUpload.vue'
import RepeatableList from '@/components/form/RepeatableList.vue'
import { newsApi } from '@/services/news/news.service'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

const isEdit      = computed(() => !!route.params.id)
const pageLoading = ref(false)
const btnLoading  = ref(false)
const snackbar    = reactive({ show: false, text: '', color: 'success' })

const CATEGORIES = ['Tadbir', "E'lon", 'Ilmiy', 'Xalqaro', 'Umumiy']
const videoTab   = ref('url')  // 'url' | 'file'

const form = reactive({
  title:       '',
  slug:        '',
  description: '',
  content:     '',
  image:       null,
  videoUrl:    '',
  gallery:     [],
  author:      '',
  categories:  [],
  tags:        [],
  draft:       true,
  featured:    false,
  publishedAt: new Date().toISOString().slice(0, 10),
})


const errors = reactive({ title: '', slug: '', content: '' })

// Auto-generate slug from title (only on create)
watch(() => form.title, val => {
  if (!isEdit.value) {
    form.slug = val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/--+/g, '-')
  }
})

// Auto-set publishedAt on first publish
const wasPublished = ref(false)
watch(() => form.draft, val => {
  if (!val && !wasPublished.value) {
    form.publishedAt   = new Date().toISOString().slice(0, 10)
    wasPublished.value = true
  }
})

const descCount = computed(() => form.description.length)

function validate() {
  let ok = true
  errors.title = form.title.trim() ? '' : 'Sarlavha majburiy'
  if (errors.title) ok = false

  if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
    errors.slug = 'Faqat kichik harf, raqam va defis (-)'
    ok = false
  } else {
    errors.slug = ''
  }

  if (!form.draft) {
    const plain = form.content.replace(/<[^>]+>/g, '').trim()
    if (plain.length < 100) {
      errors.content = "Nashr uchun kontent kamida 100 ta belgi bo'lishi kerak"
      ok = false
    } else {
      errors.content = ''
    }
  } else {
    errors.content = ''
  }

  return ok
}

async function fetchItem(id) {
  pageLoading.value = true
  try {
    const { data } = await newsApi.findOne({ params: { id } })
    const r = data.result ?? data
    Object.assign(form, {
      title:       r.title       || '',
      slug:        r.slug        || '',
      description: r.description || '',
      content:     r.content     || '',
      image:       r.image       || null,
      videoUrl:    r.videoUrl    || '',
      gallery:     Array.isArray(r.gallery) ? r.gallery : [],
      author:      r.author      || '',
      categories:  Array.isArray(r.categories) ? r.categories : [],
      tags:        Array.isArray(r.tags)        ? r.tags        : [],
      draft:       r.draft       ?? true,
      featured:    r.featured    ?? false,
      publishedAt: r.publishedAt ? r.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    })
    if (!r.draft) wasPublished.value = true
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
    const payload = {
      title:       form.title,
      slug:        form.slug || undefined,
      description: form.description,
      content:     form.content,
      image:       form.image,
      videoUrl:    form.videoUrl || undefined,
      gallery:     form.gallery.filter(Boolean),
      author:      form.author,
      categories:  form.categories,
      tags:        form.tags,
      draft:       form.draft,
      featured:    form.featured,
      publishedAt: form.publishedAt,
      type:        'news',
    }

    if (isEdit.value) {
      await newsApi.update({ params: { id: route.params.id, ...payload } })
      snackbar.text = 'Yangilik yangilandi'
    } else {
      await newsApi.create({ params: payload })
      snackbar.text = 'Yangilik yaratildi'
    }

    snackbar.color = 'success'
    snackbar.show  = true
    setTimeout(() => router.push({ name: 'news' }), 900)
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
    <!-- Page header -->
    <VCard class="mb-6" elevation="0" border>
      <VCardText class="py-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <VBtn icon="tabler-arrow-left" variant="text" size="small" :to="{ name: 'news' }" />
            <div>
              <div class="d-flex align-center gap-2 mb-1">
                <h2 class="text-h6 font-weight-bold mb-0">
                  {{ isEdit ? 'Yangilikni tahrirlash' : 'Yangi yangilik' }}
                </h2>
                <VChip
                  :color="form.draft ? 'warning' : 'success'"
                  :prepend-icon="form.draft ? 'tabler-file-pencil' : 'tabler-circle-check'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ form.draft ? 'Qoralama' : 'Nashr' }}
                </VChip>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ isEdit ? `Maqola ID: ${route.params.id} · ${form.publishedAt}` : 'Yangi maqola · nashr sanasi: ' + form.publishedAt }}
              </p>
            </div>
          </div>
          <div class="d-flex gap-2 align-center">
            <VBtn variant="text" color="secondary" size="small" :to="{ name: 'news' }">
              Bekor qilish
            </VBtn>
            <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
              Saqlash
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" rounded />

    <VRow>
      <!-- ── Left column ── -->
      <VCol cols="12" md="8">

        <!-- Basic info -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-news" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Asosiy ma'lumotlar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.title"
                  label="Sarlavha *"
                  :error-messages="errors.title"
                  variant="outlined"
                  density="comfortable"
                  @input="errors.title = ''"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.slug"
                  label="Slug (URL)"
                  :error-messages="errors.slug"
                  variant="outlined"
                  density="comfortable"
                  hint="Faqat kichik harf, raqam va defis"
                  persistent-hint
                  @input="errors.slug = ''"
                >
                  <template #prepend-inner>
                    <span class="text-caption text-medium-emphasis me-1">/news/</span>
                  </template>
                </VTextField>
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.author"
                  label="Muallif"
                  prepend-inner-icon="tabler-user"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.publishedAt"
                  label="Nashr sanasi"
                  type="date"
                  prepend-inner-icon="tabler-calendar"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Excerpt -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-align-left" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Qisqa tavsif</VCardTitle>
            <template #append>
              <span class="text-caption" :class="descCount > 300 ? 'text-error font-weight-bold' : 'text-medium-emphasis'">
                {{ descCount }}/300
              </span>
            </template>
          </VCardItem>
          <VCardText class="pt-4">
            <VTextarea
              v-model="form.description"
              placeholder="Qisqa tavsif kiriting..."
              rows="3"
              variant="outlined"
              density="comfortable"
              hide-details
              :error="descCount > 300"
            />
            <p v-if="descCount > 300" class="text-caption text-error mt-1">Maksimal 300 ta belgi</p>
          </VCardText>
        </VCard>

        <!-- Content -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-article" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">To'liq kontent</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <VAlert
              v-if="errors.content"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-3"
              :text="errors.content"
            />
            <AppHtmlEditor
              v-model="form.content"
              placeholder="Maqola matnini kiriting..."
            />
          </VCardText>
        </VCard>

        <!-- Tags -->
        <VCard elevation="0" border>
          <VCardItem class="pb-0">
            <template #prepend>
              <VIcon icon="tabler-tags" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Teglar</VCardTitle>
          </VCardItem>
          <VCardText class="pt-4">
            <RepeatableList
              v-model="form.tags"
              label="Teglar"
              placeholder="Teg qo'shing..."
            />
          </VCardText>
        </VCard>

      </VCol>

      <!-- ── Right column ── -->
      <VCol cols="12" md="4">

        <!-- Publish settings -->
        <VCard
          class="mb-4"
          elevation="0"
          :border="form.draft ? true : false"
          :color="form.draft ? undefined : 'success'"
          :variant="form.draft ? 'outlined' : 'tonal'"
        >
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon
                :icon="form.draft ? 'tabler-file-pencil' : 'tabler-circle-check'"
                :color="form.draft ? 'warning' : 'success'"
                size="18"
              />
            </template>
            <VCardTitle class="text-body-1">
              {{ form.draft ? 'Qoralama' : 'Nashr qilingan' }}
            </VCardTitle>
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
              <VSwitch
                :model-value="!form.draft"
                color="success"
                hide-details
                @update:model-value="v => (form.draft = !v)"
              />
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
            <template #prepend>
              <VIcon icon="tabler-photo" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Muqova rasmi</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <FormUpload
              v-model="form.image"
              name="image"
              label="Rasm yuklash (16:9 nisbat tavsiya)"
              upload-service-name="news"
            />
            <VAlert
              v-if="!form.draft && !form.image"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-3"
              icon="tabler-alert-triangle"
              text="Nashr uchun muqova rasmi tavsiya etiladi"
            />
          </VCardText>
        </VCard>

        <!-- Video -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon icon="tabler-video" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Video</VCardTitle>
          </VCardItem>
          <VCardText class="pt-3">
            <div class="d-flex gap-1 mb-4">
              <VBtn
                :variant="videoTab === 'url' ? 'tonal' : 'text'"
                :color="videoTab === 'url' ? 'primary' : 'default'"
                size="small"
                prepend-icon="tabler-link"
                @click="videoTab = 'url'"
              >
                URL
              </VBtn>
              <VBtn
                :variant="videoTab === 'file' ? 'tonal' : 'text'"
                :color="videoTab === 'file' ? 'primary' : 'default'"
                size="small"
                prepend-icon="tabler-upload"
                @click="videoTab = 'file'"
              >
                Qurilmadan
              </VBtn>
            </div>

            <div v-if="videoTab === 'url'">
              <VTextField
                v-model="form.videoUrl"
                placeholder="https://youtube.com/watch?v=..."
                prepend-inner-icon="tabler-brand-youtube"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details
              />
              <p class="text-caption text-medium-emphasis mt-2">
                YouTube yoki to'g'ridan-to'g'ri video URL
              </p>
            </div>
            <div v-else>
              <VideoUpload v-model="form.videoUrl" />
            </div>
          </VCardText>
        </VCard>

        <!-- Gallery -->
        <VCard class="mb-4" elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon icon="tabler-photo-album" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Fotogalereya</VCardTitle>
            <template #append>
              <VChip v-if="form.gallery.length" size="x-small" color="primary" variant="tonal">
                {{ form.gallery.length }} ta
              </VChip>
            </template>
          </VCardItem>
          <VCardText class="pt-2">
            <p class="text-caption text-medium-emphasis mb-3">
              <VIcon icon="tabler-info-circle" size="13" class="me-1" />
              Maqolaga bir nechta rasm birvarakayiga yuklash mumkin
            </p>
            <FormUpload
              v-model="form.gallery"
              name="gallery"
              label="Galereya rasmlarini bu yerga tashlang yoki tanlang"
              upload-service-name="news"
              :multiple="true"
            />
          </VCardText>
        </VCard>

        <!-- Category -->
        <VCard elevation="0" border>
          <VCardItem class="pb-2">
            <template #prepend>
              <VIcon icon="tabler-category" color="primary" size="18" />
            </template>
            <VCardTitle class="text-body-1">Kategoriya</VCardTitle>
          </VCardItem>
          <VCardText class="pt-2">
            <VSelect
              v-model="form.categories"
              :items="CATEGORIES"
              placeholder="Kategoriyalar tanlang"
              multiple
              chips
              closable-chips
              clearable
              variant="outlined"
              density="comfortable"
              hide-details
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
