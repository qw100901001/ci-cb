import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: () => import('../views/Home.vue') },
        // 子应用路由：qiankun 根据 activeRule 匹配后挂载到 #subapp-viewport
        { path: 'sub-react', name: 'sub-react', component: () => import('../views/MicroAppHost.vue') },
        { path: 'sub-vue', name: 'sub-vue', component: () => import('../views/MicroAppHost.vue') },
      ],
    },
  ],
})

export default router
