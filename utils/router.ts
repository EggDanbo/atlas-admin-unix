/**
 * 路由常量与工具
 *
 * 原 Taro 版依赖 basename / Taro 内部 stamp 参数，uni-app x 不需要，
 * 这里保留同名导出，行为简化为「直接使用页面绝对路径」。
 */
export const routes = {
  redirect: '/pages/index/index',
  home: '/pages/index/index',
  mine: '/pages/mine/index',
  login: '/pages/login/index',
  checkin: '/pages/checkin/index',
  checkinRecords: '/pages/checkin/records',
  checkinStats: '/pages/checkin/stats',
  apply: '/pages/apply/index',
  applyLeave: '/pages/apply/leave',
  contact: '/pages/contact/index',
  ruleList: '/pages/rules/index',
  ruleDetail: '/pages/rules/detail',
  ruleEdit: '/pages/rules/edit',
  board: '/pages/board/index',
  team: '/pages/team/index',
  profile: '/pages/mine/profile/index',
  password: '/pages/mine/password/index',
  facePhoto: '/pages/mine/face/index',
  userMessage: '/pages/user/message/index',
  myApply: '/pages/apply/list',
  myApplyDetail: '/pages/apply/detail',
  minePreview: '/pages/mine/preview/index',
}

/** TabBar 页面列表 */
export const tabPages: string[] = [routes.home, routes.mine]

/** 是否为 TabBar 页面 */
export function isTabBarPage(url: string): boolean {
  return tabPages.includes(url.split('?')[0])
}

/** 构建查询字符串（UTS 无 URLSearchParams） */
export function buildQuery(params: Record<string, any>): string {
  const parts: string[] = []
  const keys = Object.keys(params)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = params[key]
    if (value === undefined || value === null || value === '')
      continue
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  return parts.join('&')
}

/** 兼容保留：uni-app x 无子路径 basename 概念 */
export const H5_BASENAME = ''

export function stripBasename(path: string): string {
  return path
}

/** 当前页面路径与参数 */
export type PageInfo = {
  path: string
  params: Record<string, string>
}

export function getCurrentPageInfo(): PageInfo {
  const pages = getCurrentPages()
  const current: any = pages.length > 0 ? pages[pages.length - 1] : null
  const route: string = current != null ? String(current.route ?? '') : ''
  const path = `/${route}`
  const params: Record<string, string> = {}
  const options: any = current != null ? current.options : null
  if (options != null) {
    const keys = Object.keys(options)
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      params[k] = String(options[k])
    }
  }
  return { path, params } as PageInfo
}

/** 当前页面路径 */
export function currentRoute(): string {
  return getCurrentPageInfo().path
}

/** 读取页面参数 */
export function getPageParam(key: string): string | null {
  const params = getCurrentPageInfo().params
  return params[key] ?? null
}

/** TabBar 页面用 switchTab，其它用 navigateTo */
export function navigateTo(url: string) {
  if (isTabBarPage(url)) {
    uni.switchTab({ url: url.split('?')[0] })
    return
  }
  uni.navigateTo({ url })
}

/** 替换当前页 */
export function redirectTo(url: string) {
  if (isTabBarPage(url)) {
    uni.switchTab({ url: url.split('?')[0] })
    return
  }
  uni.redirectTo({ url })
}

/** 重启到目标页（清空页面栈） */
export function reLaunch(url: string) {
  uni.reLaunch({ url })
}
