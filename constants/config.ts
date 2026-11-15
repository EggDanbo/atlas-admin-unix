/**
 * 应用配置
 *
 * Taro 版通过 webpack DefinePlugin 注入 process.env.TARO_APP_*；
 * uni-app x 没有等价的编译期注入，这里收敛成一个显式配置对象，
 * 需要切换环境（真实后端 / 关闭 mock）时改这里即可。
 */
export const appConfig = {
  /** API 地址（留空表示同源） */
  apiUrl: '',

  /** API 前缀 */
  apiUrlPrefix: '/api',

  /** 认证模块前缀 */
  apiAuthPrefix: 'mis',

  /** 是否使用本地 mock 数据引擎（演示版保持 true） */
  useMock: true,

  /** 独立文件预览服务地址（留空=走内置预览页） */
  filePreviewBase: '',

  /** 人脸活体检测（仅 Web 端可用，App / 小程序自动降级为服务端判定） */
  faceLivenessEnable: false,

  /** 活体模型资源目录 */
  faceLivenessModelUrl: '',

  /**
   * 密码登录开关
   *
   * 打开后：非微信环境（浏览器 / App）不再只显示「请在微信中打开」，
   * 而是直接给出账号密码登录表单（演示账号 demo / 123456）。
   * 小程序端仍以微信手机号快捷登录为主。
   */
  passwordLogin: true,
}

/** 完整 API Base URL */
export function apiBaseUrl(): string {
  if (appConfig.apiUrl) {
    const prefix = appConfig.apiUrlPrefix.replace(/^\//, '')
    return `${appConfig.apiUrl}/${prefix}`
  }
  return appConfig.apiUrlPrefix
}

/** 账号密码登录开关（登录页据此显示密码登录入口） */
export const PASSWORD_LOGIN = appConfig.passwordLogin
