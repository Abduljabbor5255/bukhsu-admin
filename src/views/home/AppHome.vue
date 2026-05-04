<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const modules = [
  {
    title: 'Yangiliklar',
    description: 'Yangiliklar boshqaruvi — yaratish, tahrirlash va o\'chirish',
    icon: 'tabler-news',
    color: 'primary',
    route: 'news',
  },
  {
    title: 'Resurslar',
    description: 'Maqolalar, kitoblar va ilmiy materiallar boshqaruvi',
    icon: 'tabler-books',
    color: 'info',
    route: 'resources',
  },
  {
    title: 'O\'qituvchilar',
    description: 'O\'qituvchilar profili, maqolalari va aloqa ma\'lumotlari',
    icon: 'tabler-school',
    color: 'success',
    route: 'teachers',
  },
  {
    title: 'O\'quvchilar',
    description: 'O\'quvchilar va ularning muvaffaqiyatlari',
    icon: 'tabler-users-group',
    color: 'warning',
    route: 'students',
  },
  {
    title: 'Tadbirlar',
    description: 'Konferensiyalar, seminarlar va boshqa tadbirlar',
    icon: 'tabler-calendar-event',
    color: 'error',
    route: 'events',
  },
]

function navigateTo(routeName) {
  router.push({ name: routeName })
}
</script>

<template>
  <section>
    <h2 class="text-h4 mb-6">Bosh sahifa</h2>
    <VRow>
      <VCol
        v-for="mod in modules"
        :key="mod.route"
        cols="12"
        sm="6"
        md="4"
      >
        <VCard
          class="module-card cursor-pointer"
          :ripple="true"
          @click="navigateTo(mod.route)"
        >
          <VCardText class="d-flex flex-column align-center text-center pa-6">
            <VAvatar
              :color="mod.color"
              variant="tonal"
              size="64"
              class="mb-4"
            >
              <VIcon :icon="mod.icon" size="32" />
            </VAvatar>
            <h3 class="text-h5 mb-2">{{ mod.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ mod.description }}
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </section>
</template>

<style scoped lang="scss">
.module-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
}
</style>
