import { reactive } from 'vue'
import { getSystemInfoLite } from '@/utils/platform.ts'

/**
 * 应用级系统信息
 *
 * uni-app x 不再支持 pinia（官方推荐「独立 uts 文件 + reactive 全局变量」），
 * 这里用 class + reactive 得到与 pinia 一致的访问方式：
 * `const appStore = useAppStore(); appStore.statusBarHeight`
 */
class AppStore {
  statusBarHeight: number = 0
  windowHeight: number = 0
  windowWidth: number = 0
  platform: string = 'unknown'
  safeAreaBottom: number = 0
  networkType: string = 'unknown'

  initSystemInfo() {
    const info = getSystemInfoLite()
    this.statusBarHeight = info.statusBarHeight
    this.windowHeight = info.windowHeight
    this.windowWidth = info.windowWidth
    this.platform = info.platform
    this.safeAreaBottom = info.safeAreaBottom

    uni.getNetworkType({
      success: (res: any) => {
        this.networkType = String(res.networkType ?? 'unknown')
      },
    })
  }
}

export const appStore = reactive(new AppStore()) as AppStore

export function useAppStore(): AppStore {
  return appStore
}
