/**
 * 小程序更新检查
 *
 * uni-app x 里小程序更新管理器的获取方式与 Taro 不同，
 * 这里用条件编译兜住：非微信小程序环境返回一个空实现。
 */

export type UpdateManagerLite = {
  onCheckForUpdate: (cb: (res: any) => void) => void
  onUpdateReady: (cb: () => void) => void
  onUpdateFailed: (cb: () => void) => void
  applyUpdate: () => void
}

function noopManager(): UpdateManagerLite {
  return {
    onCheckForUpdate: (_cb: (res: any) => void) => {},
    onUpdateReady: (_cb: () => void) => {},
    onUpdateFailed: (_cb: () => void) => {},
    applyUpdate: () => {},
  } as UpdateManagerLite
}

export function getUpdateManager(): UpdateManagerLite {
  // #ifdef MP-WEIXIN
  const mgr: any = uni.getUpdateManager()
  if (mgr != null)
    return mgr as UpdateManagerLite
  // #endif
  return noopManager()
}
