<script setup lang="ts">
// 子应用路由占位组件：真正的渲染发生在 #subapp-viewport（见 MainLayout），
// qiankun 匹配 activeRule 后把子应用挂载进去
</script>

<template>
  <div class="host-loading">子应用加载中…</div>
</template>

<style scoped>
.host-loading {
  padding: 40px;
  color: #999;
  font-size: 14px;
  text-align: center;
}
</style>
