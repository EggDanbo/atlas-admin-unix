import { http } from '@/api/http'

/** 用户信息 API */
export default {
  /**
   * 获取当前登录用户信息
   */
  get: () => {
    return http.get<ServiceResult<AuthUserCurrent>>(`identity/profile/get`)
  },
  /**
   * 我的信息
   */
  info: () => {
    return http.get<ServiceResult<AuthUserProfile>>(`identity/profile/info`)
  },
  /**
   * 统计信息
   */
  stats: () => {
    return http.get<ServiceResult<DropDownItem>>(`identity/profile/stats`)
  },
  /**
   * 我的密码修改
   */
  changePassword: (data: AuthChangePassWordCommand) => {
    return http.post<ServiceResponse>(`identity/profile/changepassword`, data)
  },
  /**
   * 我的信息修改
   */
  updateProfile: (data: AuthUpdateProfileCommand) => {
    return http.post<ServiceResponse>(`identity/profile/updateprofile`, data)
  },
  /**
   * 人脸照片更新（调用方自行展示服务端错误文案，避免重复全局提示）
   */
  updateFace: (data: { image_pic: string, image_url?: string }) => {
    return http.post<ServiceResponse>(`identity/profile/updateface`, data, { showErr: false })
  },
}
