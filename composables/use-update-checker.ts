import { showToast } from '@/components/sp-toast/toast.ts'
import { isWeapp } from '@/utils/platform.ts'
import { getUpdateManager } from '@/utils/update.ts'

/**
 * 小程序更新检查
 *
 * 仅微信小程序生效，Web / App 自动跳过。
 * 由 App.uvue 的 onShow 调用（应用级生命周期）。
 */
export function checkAppUpdate() {
  if (!isWeapp())
    return

  const updateManager = getUpdateManager()

  updateManager.onCheckForUpdate((res: any) => {
    if (res.hasUpdate !== true)
      return

    updateManager.onUpdateReady(() => {
      uni.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        confirmText: '立即重启',
        cancelText: '稍后再说',
        success: (result: any) => {
          if (result.confirm === true)
            updateManager.applyUpdate()
        },
      })
    })

    updateManager.onUpdateFailed(() => {
      showToast('新版本下载失败')
    })
  })
}

/** 兼容旧调用名 */
export function useUpdateChecker() {
  checkAppUpdate()
}
