/** 令牌管理 */
import type { AuthAccessToken } from '@/types/api.ts'
import { storage } from './storage.ts'

const TOKEN_KEY = 'ACCESS-TOKEN'

export const token = {
  get(): AuthAccessToken | null {
    return storage.get<AuthAccessToken>(TOKEN_KEY)
  },

  set(data: AuthAccessToken): void {
    const timestamp = Date.now()
    data.expires_time = timestamp + 1000 * data.expires_in
    data.update_time = timestamp
    storage.set(TOKEN_KEY, data)
  },

  remove(): void {
    storage.remove(TOKEN_KEY)
  },

  isExpired(): boolean {
    const data = token.get()
    if (data == null || data.expires_time == null)
      return true
    // 提前 3 分钟判定过期
    return (data.expires_time as number) - Date.now() < 180 * 1000
  },
}
