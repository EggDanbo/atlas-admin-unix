/**
 * 运行环境与认证平台识别
 *
 * 原实现依赖 Taro.getEnv() + window.navigator/URLSearchParams，
 * uni-app x 用条件编译区分平台，Web 端再按 UA 细分微信 / 企业微信。
 */
export const ENV_TYPE = {
  WEAPP: 'WEAPP',
  WEB: 'WEB',
  APP: 'APP',
}

/** 认证平台类型 */
export type AuthPlatform = 'weapp' | 'app' | 'h5-wechat' | 'h5-wecom' | 'h5-browser'

/** 当前编译环境 */
export function getEnvName(): string {
  let env = ENV_TYPE.WEB
  // #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO
  env = ENV_TYPE.WEAPP
  // #endif
  // #ifdef APP-ANDROID || APP-IOS || APP-HARMONY
  env = ENV_TYPE.APP
  // #endif
  return env
}

const WECOM_UA_REGEX = /wxwork/i
const WECHAT_UA_REGEX = /MicroMessenger/i

/** UI 线程里读取 UserAgent（仅 Web 有） */
function userAgent(): string {
  let ua = ''
  // #ifdef WEB
  ua = navigator.userAgent
  // #endif
  return ua
}

export function getAuthPlatform(): AuthPlatform {
  const env = getEnvName()
  if (env === ENV_TYPE.WEAPP)
    return 'weapp'
  if (env === ENV_TYPE.APP)
    return 'app'

  const ua = userAgent()
  // wxwork 的 UA 里同样带 MicroMessenger，需先判断
  if (WECOM_UA_REGEX.test(ua))
    return 'h5-wecom'
  if (WECHAT_UA_REGEX.test(ua))
    return 'h5-wechat'
  return 'h5-browser'
}

export function isWeapp(): boolean {
  return getAuthPlatform() === 'weapp'
}

export function isApp(): boolean {
  return getAuthPlatform() === 'app'
}

export function isH5Wechat(): boolean {
  return getAuthPlatform() === 'h5-wechat'
}

export function isH5Wecom(): boolean {
  return getAuthPlatform() === 'h5-wecom'
}

export function isH5Browser(): boolean {
  return getAuthPlatform() === 'h5-browser'
}

/** 是否运行在浏览器（Web）端 */
export function isWeb(): boolean {
  return getEnvName() === ENV_TYPE.WEB
}

/** 相机上下文（小程序端使用，统一别名避免各端类型差异） */
export type UniCameraContext = any

/** 系统信息（跨端字段差异较大，统一返回常用字段） */
export type SystemInfoLite = {
  statusBarHeight: number
  windowHeight: number
  windowWidth: number
  platform: string
  safeAreaBottom: number
}

export function getSystemInfoLite(): SystemInfoLite {
  const info: any = uni.getSystemInfoSync()
  return {
    statusBarHeight: Number(info.statusBarHeight ?? 0),
    windowHeight: Number(info.windowHeight ?? 0),
    windowWidth: Number(info.windowWidth ?? 0),
    platform: String(info.platform ?? 'unknown'),
    safeAreaBottom: Number(info.safeAreaInsets?.bottom ?? 0),
  } as SystemInfoLite
}
