import { storage } from './storage.ts'

const REDIRECT_KEY = 'login_redirect_url'

interface LoginRedirect {
  url: string
  type: 'navigate' | 'redirect'
}

/** 保存登录跳转目标（兼容旧代码，新代码使用 authStore.saveLoginRedirect） */
export function saveLoginRedirect(url: string, type: 'navigate' | 'redirect' = 'navigate') {
  storage.set(REDIRECT_KEY, { url, type })
}

/** 消费登录跳转目标（一次性，兼容旧代码，新代码使用 authStore.consumeLoginRedirect） */
export function consumeLoginRedirect(): LoginRedirect | null {
  const redirect = storage.get<LoginRedirect>(REDIRECT_KEY)
  if (!redirect)
    return null
  storage.remove(REDIRECT_KEY)
  return redirect
}

/** 栈底安全返回 */
export function safeBack(entryMode?: 'external') {
  if (entryMode === 'external') {
    uni.reLaunch({ url: '/pages/index/index' })
    return
  }
  const pages = getCurrentPages()
  if (pages.length <= 1) {
    uni.reLaunch({ url: '/pages/index/index' })
  }
  else {
    uni.navigateBack()
  }
}
