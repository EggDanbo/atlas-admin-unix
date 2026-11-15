import { http } from '@/api/http'

import { appConfig } from '@/constants/config.ts'

const authPrefix = appConfig.apiAuthPrefix
const wecomPrefix = `/${authPrefix}/authorize/wechatwork`

/** 企业微信认证 API */
export default {
  /** 获取企业微信 ConnectOAuth2 授权 URL */
  getOAuth2Url: (data: WechatWorkAuthGetOAuth2UrlReq) => {
    return http.post<ServiceResult<string>>(`${wecomPrefix}/urlforconnectoauth2`, data, { withToken: false, showErr: false })
  },

  /** Code 换身份 */
  getToken: (data: WechatWorkAuthTokenReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wecomPrefix}/token`, data, { withToken: false, showErr: false })
  },

  /** 短信验证码绑定企业微信用户 */
  bind: (data: WechatWorkAuthBindReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wecomPrefix}/bind`, data, { withToken: false, showErr: false })
  },

  /** 发送短信验证码 */
  sendVerifyCode: (data: WechatWorkAuthSendVerifyCodeReq) => {
    return http.post<ServiceResponse>('/authorize/wechatwork/sendverifycode', data, { withToken: false, showErr: false })
  },

  /** JSSDK 签名 */
  signJSSDK: (data: WechatWorkAuthJSSDKSignatureReq) => {
    return http.post<ServiceResult<Record<string, string>>>(`${wecomPrefix}/signjssdk`, data, { withToken: false })
  },

  /** 获取企业微信应用信息 */
  getApp: () => {
    return http.get<ServiceResult<WechatWorkAuthAppInfo>>(`${wecomPrefix}/getapp`, { withToken: false })
  },

  /** 获取 OAuth state（CSRF 验证） */
  getState: () => {
    return http.get<ServiceResult<string>>('/authorize/wechatwork/getstate', { withToken: false })
  },
}
