import AppLogin from "@/views/auth/AppLogin.vue"
import Error404 from "@/views/error/Error404.vue"
import AppHome from "@/views/home/AppHome.vue"
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: AppHome,
    },
    {
      path: '/login',
      name: 'login',
      component: AppLogin,
      meta: {
        layout: 'blank',
      },
    },
    {
      path: '/news',
      name: 'news',
      component: () => import('@/pages/news/News.vue'),
    },
    {
      path: '/tours',
      name: 'tours',
      component: () => import('@/pages/tours/Tours.vue'),
    },
    {
      path: '/management',
      name: 'management',
      component: () => import('@/pages/management/Management.vue'),
    },
    {
      path: '/birthdays',
      name: 'birthdays',
      component: () => import('@/pages/birthdays/Birthdays.vue'),
    },
    {
      path: '/:catchAll(.*)',
      name: 'error-page',
      component: Error404,
      meta: {
        layout: 'blank',
      },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const AUTH_TOKEN = localStorage.getItem('accessToken')
  if (to.name === 'login') return next()
  if (AUTH_TOKEN) {
    if (to.path === '/') {
      return next({ name: 'home' })
    } else {
      return next()
    }
  } else {
    return next({ name: 'login' })
  }
})

// ? For splash screen
// Remove afterEach hook if you are not using splash screen
router.afterEach(() => {
  // Remove initial loading
  const appLoading = document.getElementById('loading-bg')
  if (appLoading) {
    appLoading.style.display = 'none'
  }
})

export default router
