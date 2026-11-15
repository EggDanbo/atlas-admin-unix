/**
 * 本地存储（uni.setStorageSync 封装，带项目前缀避免同源 key 冲突）
 */
const STORAGE_PREFIX = 'lhapp:'

function prefixKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

export const storage = {
  get<T>(key: string): T | null {
    try {
      const val = uni.getStorageSync(prefixKey(key))
      if (val === '' || val == null)
        return null
      return val as T
    }
    catch (e) {
      return null
    }
  },

  set(key: string, value: any): void {
    try {
      uni.setStorageSync(prefixKey(key), value)
    }
    catch (e) {
      // 存储失败不影响主流程
    }
  },

  remove(key: string): void {
    try {
      uni.removeStorageSync(prefixKey(key))
    }
    catch (e) {
      // ignore
    }
  },

  clear(): void {
    try {
      const info = uni.getStorageInfoSync()
      const keys: string[] = info.keys ?? []
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (key.startsWith(STORAGE_PREFIX))
          uni.removeStorageSync(key)
      }
    }
    catch (e) {
      // ignore
    }
  },
}
