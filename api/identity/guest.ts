import { http } from '@/api/http'

import { appConfig } from '@/constants/config.ts'

const authPrefix = appConfig.apiAuthPrefix
const guestPrefix = `/${authPrefix}/authorize/guest`
const guestProfilePrefix = `/${authPrefix}/guest/profile`

/** 访客认证 API */
export default {
  /** 访客登录（微信 OAuth code 换身份） */
  login: (data: { code: string, state: string }) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${guestPrefix}/login`, data, { withToken: false, showErr: false })
  },

  /** 访客登记（提交个人信息获取 JWT） */
  register: (data: GuestAuthRegisterReq) => {
    return http.post<ServiceResult<WechatAuthLoginTokenDto>>(`${guestPrefix}/register`, data, { withToken: false, showErr: false })
  },

  /** 获取当前访客信息 */
  getProfile: () => {
    return http.get<ServiceResult<GuestAuthGuestInfo>>(`${guestProfilePrefix}/get`)
  },

  /** 获取访客详细信息 */
  getInfo: () => {
    return http.get<ServiceResult<GuestAuthGuestProfile>>(`${guestProfilePrefix}/info`)
  },

  /** 更新访客信息 */
  updateProfile: (data: GuestAuthUpdateProfileReq) => {
    return http.post<ServiceResponse>(`${guestProfilePrefix}/updateprofile`, data)
  },

  /** 人脸照片上传 */
  updateFace: (data: GuestAuthUpdateFaceReq) => {
    return http.post<ServiceResponse>(`${guestProfilePrefix}/updateface`, data)
  },

  /** 获取访客二维码（base64） */
  getQrCode: () => {
    return http.get<ServiceResult<string>>(`${guestProfilePrefix}/qrcode`)
  },
}
