<script setup>
import { useRouter } from 'vue-router';

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
    title: 'Turlar',
    description: 'Turlar ro\'yxati va boshqaruvi',
    icon: 'tabler-map-2',
    color: 'success',
    route: 'tours',
  },
  {
    title: 'Rahbariyat',
    description: 'Rahbariyat — lavozim, ism, familiya, ish vaqti',
    icon: 'tabler-users',
    color: 'warning',
    route: 'management',
  },
  {
    title: 'Tug\'ilgan kunlar',
    description: 'Tug\'ilgan kunlar ro\'yxati va boshqaruvi',
    icon: 'tabler-cake',
    color: 'error',
    route: 'birthdays',
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
        md="3"
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
