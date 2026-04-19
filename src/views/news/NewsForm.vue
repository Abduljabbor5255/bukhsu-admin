<script setup>
import AppHtmlEditor from '@/components/editor/AppHtmlEditor.vue'
import FormUpload from '@/components/form/FormUpload.vue'
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

const form = reactive({
  title:       '',
  slug:        '',
  description: '',
  content:     '',
  image:       null,
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
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div class="d-flex align-center gap-3">
        <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'news' }" />
        <div>
          <h2 class="text-h5 font-weight-bold">
            {{ isEdit ? 'Yangilikni tahrirlash' : 'Yangi yangilik' }}
          </h2>
          <p v-if="isEdit" class="text-caption text-medium-emphasis mb-0">
            ID: {{ route.params.id }}
          </p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <VBtn variant="tonal" color="secondary" :to="{ name: 'news' }">Bekor qilish</VBtn>
        <VBtn color="primary" prepend-icon="tabler-device-floppy" :loading="btnLoading" @click="submit">
          Saqlash
        </VBtn>
      </div>
    </div>

    <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" />

    <VRow>
      <!-- ── Left column ── -->
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

              <VCol cols="12">
                <VTextField
                  v-model="form.slug"
                  label="Slug (URL)"
                  :error-messages="errors.slug"
                  hint="Faqat kichik harf, raqam va defis. Masalan: mening-yangiligim"
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
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.publishedAt"
                  label="Nashr sanasi"
                  type="date"
                  prepend-inner-icon="tabler-calendar"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Excerpt -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-3">
              <p class="text-overline text-medium-emphasis mb-0">Qisqa tavsif</p>
              <span
                class="text-caption"
                :class="descCount > 300 ? 'text-error' : 'text-medium-emphasis'"
              >{{ descCount }}/300</span>
            </div>
            <VTextarea
              v-model="form.description"
              label="Excerpt (qisqa tavsif)"
              rows="3"
              :error-messages="descCount > 300 ? 'Maksimal 300 ta belgi' : ''"
            />
          </VCardText>
        </VCard>

        <!-- Content -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-3">To'liq kontent</p>
            <p v-if="errors.content" class="text-caption text-error mb-2">
              <VIcon icon="tabler-alert-circle" size="13" /> {{ errors.content }}
            </p>
            <AppHtmlEditor
              v-model="form.content"
              label="Maqola matni"
              placeholder="Maqola matnini kiriting..."
            />
          </VCardText>
        </VCard>

        <!-- Tags -->
        <VCard>
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-3">Teglar</p>
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
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-4">Nashr sozlamalari</p>

            <div class="d-flex align-center justify-space-between mb-1">
              <div>
                <p class="text-body-2 font-weight-medium mb-0">Nashr qilish</p>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ form.draft ? "Qoralama — faqat admin ko'radi" : 'Saytda ko\'rinadi' }}
                </p>
              </div>
              <VSwitch
                :model-value="!form.draft"
                color="success"
                hide-details
                @update:model-value="v => (form.draft = !v)"
              />
            </div>

            <VDivider class="my-3" />

            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 font-weight-medium mb-0">Slayderda ko'rsatish</p>
                <p class="text-caption text-medium-emphasis mb-0">Bosh sahifa slayderida</p>
              </div>
              <VSwitch
                v-model="form.featured"
                color="warning"
                hide-details
              />
            </div>
          </VCardText>
        </VCard>

        <!-- Cover image -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-3">Muqova rasmi</p>
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
            >
              Nashr uchun muqova rasmi tavsiya etiladi
            </VAlert>
          </VCardText>
        </VCard>

        <!-- Category -->
        <VCard class="mb-4">
          <VCardText>
            <p class="text-overline text-medium-emphasis mb-3">Kategoriya</p>
            <VSelect
              v-model="form.categories"
              :items="CATEGORIES"
              label="Kategoriyalar tanlang"
              multiple
              chips
              closable-chips
              clearable
            />
          </VCardText>
        </VCard>

        <!-- Status card -->
        <VCard :color="form.draft ? undefined : 'success'" :variant="form.draft ? 'outlined' : 'tonal'">
          <VCardText class="d-flex align-center gap-3 py-3">
            <VIcon
              :icon="form.draft ? 'tabler-file-pencil' : 'tabler-circle-check'"
              :color="form.draft ? 'default' : 'success'"
              size="22"
            />
            <div>
              <p class="text-body-2 font-weight-semibold mb-0">
                {{ form.draft ? 'Qoralama' : 'Nashr qilingan' }}
              </p>
              <p class="text-caption mb-0 text-medium-emphasis">{{ form.publishedAt }}</p>
            </div>
          </VCardText>
        </VCard>

      </VCol>
    </VRow>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      <VIcon :icon="snackbar.color === 'success' ? 'tabler-check' : 'tabler-alert-circle'" class="me-2" />
      {{ snackbar.text }}
    </VSnackbar>
  </section>
</template>
