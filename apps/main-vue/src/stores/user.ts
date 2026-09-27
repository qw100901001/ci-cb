import type { UserInfo } from '@cb/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 模拟登录态。真实项目中这里来自登录接口 / localStorage 恢复
 */
export const useUserStore = defineStore('user', () => {
  const mockUsers: UserInfo[] = [
    { id: 1, name: '张三', role: 'admin', token: 'mock-token-admin', loginAt: Date.now() },
    { id: 2, name: '李四', role: 'user', token: 'mock-token-user', loginAt: Date.now() },
  ]

  const userInfo = ref<UserInfo>(mockUsers[0])
  const history = ref<UserInfo[]>([mockUsers[0]])

  function switchUser() {
    const next = mockUsers.find((u) => u.id !== userInfo.value.id) ?? mockUsers[0]
    userInfo.value = { ...next, loginAt: Date.now() }
    history.value.push(userInfo.value)
  }

  return { userInfo, history, switchUser }
})
