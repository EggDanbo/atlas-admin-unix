import { http } from '@/api/http'

import { appConfig } from '@/constants/config.ts'

const authPrefix = appConfig.apiAuthPrefix

/** 登录授权 API */
export default {
  /** 账号密码登录 */
  token: (data: AuthPasswordTokenCommand) => {
    return http.post<ServiceResult<AuthAccessToken>>(`/${authPrefix}/authorize/tokensafety`, data, { withToken: false, authRole: null, showErr: false })
  },

  /** 注销令牌 */
  unToken: (refresh_token: string | undefined) => {
    return http.get(`/identity/authorize/untoken`, { refresh_token }, { authRole: 'refreshToken', isReturnNativeResponse: true, isTransformResponse: false })
  },

  /** 刷新令牌 */
  refreshToken: (refresh_token: string) => {
    return http.get<ServiceResult<AuthAccessToken>>(`/${authPrefix}/authorize/refreshtoken`, { key: refresh_token }, { withToken: false, authRole: 'refreshToken' })
  },
  /**
   * 发送登录验证码
   * @param data
   */
  sendVerifyCode: (data: AuthSendVerifyCodeCommand) => {
    return http.post<ServiceResponse>(`/${authPrefix}/authorize/sendverifycode`, data, { withToken: false, authRole: null, showErr: false })
  },
  /**
   * 基于短信验证码获取API授权令牌
   * @param data 请求数据
   */
  sms: (data: AuthVerifyCodeTokenCommand) => {
    return http.post<ServiceResult<AuthAccessToken>>(`/${authPrefix}/authorize/sms`, data, { withToken: false, authRole: null, showErr: false })
  },
}
