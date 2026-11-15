import { reactive } from 'vue'
import { common } from '@/api/misc/index.ts'
import { isObject } from '@/utils/is.ts'

/** 应用信息（后端下发，字段按需扩展） */
export type AppInfo = {
  appname?: string
  version?: string
  logincaptcha?: boolean
  copyright?: string
  [key: string]: any
}

class AppInfoStore {
  appInfo: AppInfo | null = null

  async asyncAppInfo(): Promise<AppInfo | null> {
    try {
      const res = await common.appinfo()
      if (!res.isSuccess)
        return this.appInfo
      const data = res.data
      if (data != null && isObject(data)) {
        this.appInfo = {
          ...(this.appInfo ?? {}),
          ...data,
        } as AppInfo
      }
      return this.appInfo
    }
    catch (error) {
      console.error('获取应用信息失败:', error)
      return this.appInfo
    }
  }

  get appname(): string {
    return String(this.appInfo?.appname ?? 'Atlas 工作台')
  }

  get version(): string {
    return String(this.appInfo?.version ?? '1.0.0')
  }

  get logincaptcha(): boolean {
    return this.appInfo?.logincaptcha === true
  }
}

export const appInfoStore = reactive(new AppInfoStore()) as AppInfoStore

export function useAppInfoStore(): AppInfoStore {
  return appInfoStore
}
