import { watch } from 'vue'
import { useAuthStore } from '@/store/auth.ts'

/**
 * 认证感知的页面加载 Hook
 *
 * 替代 useLoad，等待 authStore 初始化完成后再决定是否执行回调：
 * - 已登录（auth）→ 立即执行回调
 * - 初始化中（loading）→ 等待初始化完成后，若已登录则执行
 * - 未登录（guest）→ 不执行，避免无意义的 401 请求
 *
 * @example
 * ```ts
 * // 替代前
 * useLoad((options) => {
 *   loadDetail(options.id)
 * })
 *
 * // 替代后
 * useAuthLoad((options) => {
 *   loadDetail(options.id)
 * })
 * ```
 */
export function useAuthLoad(callback: (options: Record<string, string | undefined>) => void) {
  const authStore = useAuthStore()

  onLoad((options) => {
    const opts = options as Record<string, string | undefined>
    if (authStore.status === 'auth') {
      callback(opts)
      return
    }

    // loading 状态：等待初始化完成后判断
    if (authStore.status === 'loading') {
      const stop = watch(() => authStore.status, (status) => {
        stop()
        if (status === 'auth')
          callback(opts)
      })
    }
    // guest 状态：不执行，避免 401
  })
}
