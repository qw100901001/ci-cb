<script setup lang="ts">
import type { SubAppMountProps } from '@cb/shared'
import { formatDate } from '@cb/shared'
import { computed, ref } from 'vue'
import { qiankunWindow } from 'vite-plugin-qiankun/es/helper'

// 主应用注入的 props（getUserInfo / setGlobalState 等）
const props = defineProps<Partial<SubAppMountProps>>()

const count = ref(0)
const poweredByQiankun = Boolean(qiankunWindow.__POWERED_BY_QIANKUN__)

// 每次渲染实时读取主应用 pinia 中的登录态（对比 React 版：computed 天然缓存依赖）
const user = computed(() => props.getUserInfo?.())

function notifyMain() {
  props.setGlobalState?.({
    lastEvent: {
      from: 'sub-vue',
      text: `Vue 子应用计数器到 ${count.value + 1}，冒个泡～`,
      time: Date.now(),
    },
  })
}
</script>

<template>
  <div class="subapp">
    <section class="card">
      <h2>💚 Vue3 子应用</h2>
      <p class="mode">
        运行模式：
        <span :class="poweredByQiankun ? 'tag ok' : 'tag'">
          {{ poweredByQiankun ? 'qiankun 沙箱内' : '独立运行' }}
        </span>
      </p>

      <div class="counter">
        <button @click="count--">-</button>
        <span class="num">{{ count }}</span>
        <button @click="count++">+</button>
      </div>
      <p class="hint">组件状态在 unmount 后销毁，重新挂载时回到 0（沙箱隔离的效果之一）</p>
    </section>

    <div class="grid">
      <section class="card">
        <h3>主应用下发的登录态（props.getUserInfo）</h3>
        <dl v-if="user" class="kv">
          <dt>用户</dt>
          <dd>{{ user.name }}</dd>
          <dt>角色</dt>
          <dd>{{ user.role }}</dd>
          <dt>Token</dt>
          <dd><code>{{ user.token }}</code></dd>
          <dt>登录时间</dt>
          <dd>{{ formatDate(user.loginAt) }}</dd>
        </dl>
        <p v-else class="hint">独立运行模式，没有主应用下发的用户信息</p>
      </section>

      <section class="card">
        <h3>向主应用上报事件（setGlobalState）</h3>
        <p class="hint">点击后回到基座首页，可以在「子应用事件日志」中看到这条消息</p>
        <button class="btn primary" @click="notifyMain">通知主应用</button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.subapp {
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

.hint {
  margin: 0;
  color: #888;
  font-size: 13px;
  line-height: 1.6;
}

.mode {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 13px;
  color: #666;
}

.tag {
  padding: 2px 10px;
  border-radius: 999px;
  background: #eee;
  color: #666;
  font-size: 12px;
}

.tag.ok {
  background: #e3f7ee;
  color: #1a7f4f;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.counter {
  display: flex;
  align-items: center;
  gap: 16px;
}

.counter button {
  width: 36px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
}

.counter button:hover {
  border-color: #42d392;
}

.counter .num {
  min-width: 60px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #42b883;
}

.kv {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px 12px;
  margin: 0;
  font-size: 13px;
}

.kv dt {
  color: #999;
}

.kv dd {
  margin: 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #eee;
  color: #333;
  font-size: 13px;
  cursor: pointer;
}

.btn.primary {
  background: #42b883;
  color: #fff;
}

.btn.primary:hover {
  background: #33a06d;
}
</style>
