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
      meta: { layout: 'blank' },
    },

    // News
    {
      path: '/news',
      name: 'news',
      component: () => import('@/views/news/NewsList.vue'),
    },
    {
      path: '/news/create',
      name: 'news-create',
      component: () => import('@/views/news/NewsForm.vue'),
    },
    {
      path: '/news/:id/edit',
      name: 'news-edit',
      component: () => import('@/views/news/NewsForm.vue'),
    },

    // Resources
    {
      path: '/resources',
      name: 'resources',
      component: () => import('@/views/resources/ResourcesList.vue'),
    },
    {
      path: '/resources/create',
      name: 'resources-create',
      component: () => import('@/views/resources/ResourcesForm.vue'),
    },
    {
      path: '/resources/:id/edit',
      name: 'resources-edit',
      component: () => import('@/views/resources/ResourcesForm.vue'),
    },

    // Teachers
    {
      path: '/teachers',
      name: 'teachers',
      component: () => import('@/views/teachers/TeachersList.vue'),
    },
    {
      path: '/teachers/create',
      name: 'teachers-create',
      component: () => import('@/views/teachers/TeachersForm.vue'),
    },
    {
      path: '/teachers/:id/edit',
      name: 'teachers-edit',
      component: () => import('@/views/teachers/TeachersForm.vue'),
    },

    // Students
    {
      path: '/students',
      name: 'students',
      component: () => import('@/views/students/StudentsList.vue'),
    },
    {
      path: '/students/create',
      name: 'students-create',
      component: () => import('@/views/students/StudentsForm.vue'),
    },
    {
      path: '/students/:id/edit',
      name: 'students-edit',
      component: () => import('@/views/students/StudentsForm.vue'),
    },

    // Events
    {
      path: '/events',
      name: 'events',
      component: () => import('@/views/events/EventsList.vue'),
    },
    {
      path: '/events/create',
      name: 'events-create',
      component: () => import('@/views/events/EventsForm.vue'),
    },
    {
      path: '/events/:id/edit',
      name: 'events-edit',
      component: () => import('@/views/events/EventsForm.vue'),
    },

    // Chat users
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/chat/ChatList.vue'),
    },

    {
      path: '/:catchAll(.*)',
      name: 'error-page',
      component: Error404,
      meta: { layout: 'blank' },
    },
  ],
})

router.beforeEach((to, _from, next) => {
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

router.afterEach(() => {
  const appLoading = document.getElementById('loading-bg')
  if (appLoading) {
    appLoading.style.display = 'none'
  }
})

export default router
