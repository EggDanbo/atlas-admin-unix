import { http } from '@/api/http'

import { appConfig } from '@/constants/config.ts'

const authPrefix = appConfig.apiAuthPrefix
const wechatPrefix = `/${authPrefix}/authorize/wechat`

/** 微信认证 API */
export default {
  /** 获取微信 OAuth 授权 URL（仅 H5） */
  getAuthorizeUrl: (params: WechatAuthGetAuthorizeUrlReq) => {
    return http.get<ServiceResult<string>>(`${wechatPrefix}/getauthorizeurl`, params, { withToken: false, showErr: false })
  },

  /** Code 换身份 — 公众号（仅 H5） */
  getWxToken: (data: WechatAuthWxTokenReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wechatPrefix}/token`, data, { withToken: false, showErr: false })
  },

  /** Code 换身份 — 小程序 */
  getWxappToken: (data: WechatAuthWxappTokenReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wechatPrefix}/apptoken`, data, { withToken: false, showErr: false })
  },

  /** 短信验证码登录 + 绑定（H5） */
  bindWxUser: (data: WechatAuthWxBindReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wechatPrefix}/bind`, data, { withToken: false, showErr: false })
  },

  /** 短信验证码登录 + 绑定（小程序） */
  bindWxappUser: (data: WechatAuthWxappBindReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wechatPrefix}/appbind`, data, { withToken: false, showErr: false })
  },

  /** 微信手机号一键登录（仅小程序） */
  phoneLoginToken: (data: WechatAuthWxappPhoneReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${wechatPrefix}/appphonelogintoken`, data, { withToken: false, showErr: false })
  },

  /** 发送短信验证码（H5） */
  sendVerifyCode: (data: WechatAuthSendVerifyCodeReq) => {
    return http.post<ServiceResponse>(`/authorize/wechat/sendverifycode`, data, { withToken: false, showErr: false })
  },

  /** 发送短信验证码（小程序） */
  sendAppVerifyCode: (data: WechatAuthSendVerifyCodeReq) => {
    return http.post<ServiceResponse>(`/authorize/wechat/appsendverifycode`, data, { withToken: false, showErr: false })
  },

  /** JSSDK 签名（仅 H5） */
  signJSSDK: (data: WechatAuthJSSDKSignatureReq) => {
    return http.post<ServiceResult<Record<string, string>>>(`${wechatPrefix}/signjssdk`, data, { withToken: false })
  },
}
