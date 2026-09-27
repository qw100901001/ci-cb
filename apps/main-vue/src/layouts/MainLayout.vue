<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()

const isMicroRoute = computed(() => route.path.startsWith('/sub-'))

const menus = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/sub-react', label: 'React 子应用', icon: '⚛️' },
  { path: '/sub-vue', label: 'Vue 子应用', icon: '💚' },
]
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-badge">CB</span>
        <span class="logo-text">微前端基座</span>
      </div>
      <nav class="menu">
        <router-link
          v-for="item in menus"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          exact-active-class="active"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">qiankun + pnpm monorepo</div>
    </aside>

    <div class="main">
      <header class="topbar">
        <span class="crumb">{{ route.meta.title ?? route.path }}</span>
        <span class="user-chip">
          <span class="dot" />
          {{ userStore.userInfo.name }}（{{ userStore.userInfo.role }}）
        </span>
      </header>

      <main class="content">
        <!-- 主应用自身页面（v-show 不能直接放 router-view 上：其渲染结果是 fragment，指令不生效） -->
        <div v-show="!isMicroRoute" class="page-host">
          <router-view />
        </div>

        <!-- qiankun 子应用挂载容器：常驻 DOM，避免挂载竞态；仅子应用路由时可见 -->
        <div id="subapp-viewport" v-show="isMicroRoute"></div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #1e2430;
  color: #cbd3e1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #42d392, #647eff);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}

.logo-text {
  font-weight: 600;
  color: #fff;
}

.menu {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #cbd3e1;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.menu-item.active {
  background: rgba(100, 126, 255, 0.25);
  color: #fff;
}

.sidebar-footer {
  padding: 14px 16px;
  font-size: 12px;
  opacity: 0.5;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f5f6fa;
}

.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e8eaf0;
}

.crumb {
  font-size: 14px;
  color: #666;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  background: #f0f2f8;
  padding: 6px 12px;
  border-radius: 999px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #42d392;
}

.content {
  flex: 1;
  padding: 24px;
}
</style>
