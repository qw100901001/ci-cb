<script setup lang="ts">
import type { SubAppEvent } from '@cb/shared'
import { formatDate } from '@cb/shared'
import { onMounted, onUnmounted, ref } from 'vue'
import { offGlobalStateChange, onGlobalStateChange } from '../micro'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

/** 子应用通过 setGlobalState 上报的事件日志 */
const events = ref<SubAppEvent[]>([])

onMounted(() => {
  onGlobalStateChange((state) => {
    if (state.lastEvent) {
      events.value = [state.lastEvent, ...events.value].slice(0, 20)
    }
  }, true)
})

onUnmounted(() => {
  offGlobalStateChange()
})
</script>

<template>
  <div class="home">
    <section class="card">
      <h2>👋 欢迎来到微前端 Demo</h2>
      <p>
        本项目是一个 pnpm + Turborepo 管理的 monorepo，当前页面是 <b>Vue3 基座</b>，
        负责菜单布局、路由分发与登录态管理；左侧可以进入 <b>React</b> 与 <b>Vue3</b>
        两个子应用，它们由 qiankun 加载并运行在各自的 JS 沙箱中。
      </p>
      <ul class="tips">
        <li>点击左侧菜单切换子应用，观察浏览器地址栏与页面内容</li>
        <li>点击下方"切换用户"，再进入子应用，能看到子应用读到的登录态实时变化</li>
        <li>子应用页面里点"通知主应用"，本页的事件日志会收到消息（qiankun 全局状态通信）</li>
      </ul>
    </section>

    <div class="grid">
      <section class="card">
        <h3>当前登录态（Pinia，主应用持有）</h3>
        <dl class="kv">
          <dt>用户</dt>
          <dd>{{ userStore.userInfo.name }}</dd>
          <dt>角色</dt>
          <dd>{{ userStore.userInfo.role }}</dd>
          <dt>Token</dt>
          <dd><code>{{ userStore.userInfo.token }}</code></dd>
          <dt>登录时间</dt>
          <dd>{{ formatDate(userStore.userInfo.loginAt) }}</dd>
        </dl>
        <button class="btn" @click="userStore.switchUser()">切换用户（演示 props 实时下发）</button>
      </section>

      <section class="card">
        <h3>子应用事件日志（initGlobalState 通信）</h3>
        <p v-if="events.length === 0" class="empty">暂无事件 —— 去子应用里点「通知主应用」试试</p>
        <ul class="event-list">
          <li v-for="(e, i) in events" :key="i">
            <span class="tag" :class="e.from"> {{ e.from }} </span>
            <span class="text">{{ e.text }}</span>
            <span class="time">{{ formatDate(e.time, 'HH:mm:ss') }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
}

.card {
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 12px;
  padding: 20px 24px;
}

.card h2 {
  margin: 0 0 10px;
  font-size: 18px;
}

.card h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.card p {
  margin: 0;
  color: #555;
  line-height: 1.7;
  font-size: 14px;
}

.tips {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #666;
  font-size: 13px;
  line-height: 1.9;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.kv {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px 12px;
  margin: 0 0 16px;
  font-size: 13px;
}

.kv dt {
  color: #999;
}

.kv dd {
  margin: 0;
  color: #333;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #647eff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.btn:hover {
  background: #4f6bff;
}

.empty {
  color: #999;
  font-size: 13px;
}

.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.tag.sub-react {
  background: #61dafb;
  color: #00303f;
}

.tag.sub-vue {
  background: #42d392;
}

.event-list .text {
  flex: 1;
}

.event-list .time {
  color: #999;
}
</style>
